<?php
ini_set('display_errors', 0);
error_reporting(E_ALL);

set_error_handler(function($errno, $errstr, $errfile, $errline) {
    echo json_encode(['status'=>'ERROR', 'message'=> "Error: $errstr en $errfile linea $errline"]);
    exit;
});
set_exception_handler(function($exception) {
    echo json_encode(['status'=>'ERROR', 'message'=>$exception->getMessage()]);
    exit;
});

header('Content-Type: application/json');

$usuario = "root";
$contraseña = "";
$servidor = "localhost";
$baseDatos = "presupuesto_auto";

$conexion = new mysqli($servidor, $usuario, $contraseña, $baseDatos);
if ($conexion->connect_error) {
    echo json_encode(['status' => 'ERROR', 'message' => "Conexión fallida: " . $conexion->connect_error]);
    exit;
}

$telefono = $conexion->real_escape_string($_POST['telefono'] ?? '');
if (empty($telefono)) {
    echo json_encode(['status' => 'ERROR', 'message' => "El teléfono es obligatorio para identificar al cliente"]);
    exit;
}

$idPresupuesto = intval($_POST['id_presupuesto'] ?? 0);

if ($idPresupuesto <= 0) {
    $stmtPresupuesto = $conexion->prepare("
        SELECT presupuesto.id 
        FROM presupuesto
        JOIN cliente ON presupuesto.id_cliente = cliente.id
        WHERE cliente.telefono = ?
        ORDER BY presupuesto.id DESC
        LIMIT 1
    ");
    $stmtPresupuesto->bind_param("s", $telefono);
    $stmtPresupuesto->execute();
    $res = $stmtPresupuesto->get_result();
    if ($fila = $res->fetch_assoc()) {
        $idPresupuesto = intval($fila['id']);
    } else {
        echo json_encode(['status' => 'ERROR', 'message' => "No se ha encontrado presupuesto para este cliente"]);
        exit;
    }
    $stmtPresupuesto->close();
}

$stmtCheck = $conexion->prepare("SELECT id FROM presupuesto WHERE id = ?");
$stmtCheck->bind_param("i", $idPresupuesto);
$stmtCheck->execute();
$stmtCheck->store_result();
if ($stmtCheck->num_rows === 0) {
    echo json_encode(['status' => 'ERROR', 'message' => "El presupuesto no existe"]);
    exit;
}
$stmtCheck->close();

$nombre = $conexion->real_escape_string($_POST['nombre'] ?? '');
$apellidos = $conexion->real_escape_string($_POST['apellidos'] ?? '');
$email = $conexion->real_escape_string($_POST['email'] ?? '');
$direccion = $conexion->real_escape_string($_POST['direccion'] ?? '');
$codigoPostal = $conexion->real_escape_string($_POST['codigoPostal'] ?? '');
$fechaNacimiento = $conexion->real_escape_string($_POST['fechaNacimiento'] ?? '');
$iban = $conexion->real_escape_string($_POST['iban'] ?? '');
$producto = $conexion->real_escape_string($_POST['producto'] ?? '');
$precio = floatval($_POST['precio'] ?? 0);

//Validaciones
if (empty($apellidos)) {
    echo json_encode(['status' => 'ERROR', 'message' => "El campo 'apellidos' es obligatorio."]);
    exit;
}

if (empty($email) || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
    echo json_encode(['status' => 'ERROR', 'message' => "El correo electrónico no es válido."]);
    exit;
}

if (empty($direccion)) {
    echo json_encode(['status' => 'ERROR', 'message' => "La dirección es obligatoria."]);
    exit;
}

if (empty($iban) || !preg_match('/^[A-Z]{2}[0-9]{2}[A-Z0-9]{11,30}$/', $iban)) {
    echo json_encode(['status' => 'ERROR', 'message' => "El IBAN no tiene un formato válido."]);
    exit;
}

//Si pasa validaciones, actualizamos cliente y creamos póliza
$conexion->begin_transaction();

try {
    $sqlActualizarCliente = "UPDATE cliente SET
        nombre = ?, 
        apellidos = ?, 
        fecha_nacimiento = ?, 
        cp = ?,
        email = ?,
        direccion = ?,
        iban = ?
        WHERE telefono = ?";
    $stmtActualizar = $conexion->prepare($sqlActualizarCliente);
    $stmtActualizar->bind_param("ssssssss", $nombre, $apellidos, $fechaNacimiento, $codigoPostal, $email, $direccion, $iban, $telefono);
    if (!$stmtActualizar->execute()) {
        throw new Exception("Error al actualizar cliente: " . $stmtActualizar->error);
    }
    $stmtActualizar->close();

    $stmtCliente = $conexion->prepare("SELECT id FROM cliente WHERE telefono = ?");
    $stmtCliente->bind_param("s", $telefono);
    $stmtCliente->execute();
    $resultadoCliente = $stmtCliente->get_result();
    if ($resultadoCliente->num_rows === 0) {
        throw new Exception("Cliente no encontrado");
    }
    $filaCliente = $resultadoCliente->fetch_assoc();
    $idCliente = intval($filaCliente['id']);
    $stmtCliente->close();

    $fechaContratacion = date('Y-m-d');
    $sqlInsertarPoliza = "INSERT INTO poliza (id_cliente, id_presupuesto, fecha_contratacion, producto, importe_total)
        VALUES (?, ?, ?, ?, ?)";
    $stmtInsertar = $conexion->prepare($sqlInsertarPoliza);
    $stmtInsertar->bind_param("iissd", $idCliente, $idPresupuesto, $fechaContratacion, $producto, $precio);
    if (!$stmtInsertar->execute()) {
        throw new Exception("Error al insertar póliza: " . $stmtInsertar->error);
    }
    $stmtInsertar->close();

    $conexion->commit();

    echo json_encode([
        'status' => 'OK',
        'message' => 'Póliza contratada correctamente',
        'id_presupuesto' => $idPresupuesto
    ]);
} catch (Exception $e) {
    $conexion->rollback();
    echo json_encode(['status' => 'ERROR', 'message' => $e->getMessage()]);
}

$conexion->close();
