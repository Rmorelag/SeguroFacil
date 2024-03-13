<?php

use Sabberworm\CSS\Value\Value;

error_reporting(E_ALL);
ini_set('display_errors', 1);
header('Content-Type: application/json');

$datos = json_decode(file_get_contents("php://input"), true);

if (!$datos) {
    echo json_encode(["error" => "No se recibieron datos"]);
    exit();
}

//Se recogen datos del JSON
$nombre = $datos['nombre'];
$telefono = $datos['telefono'];
$fechaNacimiento = $datos['fechaNacimiento'];
$codigoPostal = $datos['codigoPostal'];
$fechaCarnet = $datos['fechaCarnet'];
$aniosSeguro = $datos['aniosSeguro'];
$numPartes = $datos['numPartes'];
$marca = $datos['marca'];
$modelo = $datos['modelo'];
$anio = $datos['anio'];
$matricula = $datos['matricula'];
$producto = $datos['producto'];
$precio = $datos['precio'];

//Validaciones
$errores = [];

if (!preg_match('/^[\p{L} ]{2,}$/u', $nombre)) {
    $errores[] = "El nombre debe tener al menos 2 letras y solo letras.";
}

if (!preg_match('/^\d{9}$/', $telefono)) {
    $errores[] = "El teléfono debe tener 9 dígitos.";
}

if (!preg_match('/^\d{5}$/', $codigoPostal)) {
    $errores[] = "El código postal debe tener 5 dígitos.";
}

$fechaNacObj = DateTime::createFromFormat('Y-m-d', $fechaNacimiento);
$fechaCarnetObj = DateTime::createFromFormat('Y-m-d', $fechaCarnet);
$hoy = new DateTime();

if (!$fechaNacObj) {
    $errores[] = "La fecha de nacimiento no es válida.";
} elseif ($fechaNacObj > $hoy->modify('-18 years')) {
    $errores[] = "Debes tener al menos 18 años.";
}

$hoy = new DateTime();
if (!$fechaCarnetObj) {
    $errores[] = "La fecha del carnet no es válida.";
} elseif ($fechaCarnetObj > new DateTime()) {
    $errores[] = "La fecha del carnet no puede ser futura.";
} elseif ($fechaNacObj && $fechaCarnetObj < $fechaNacObj->modify('+18 years')) {
    $errores[] = "Debes tener al menos 18 años al obtener el carnet.";
}

if (!is_numeric($aniosSeguro) || $aniosSeguro < 0) {
    $errores[] = "Años con seguro no válidos.";
}

if (!is_numeric($numPartes) || $numPartes < 0) {
    $errores[] = "Número de partes no válido.";
}

if (empty($matricula)) {
    $errores[] = "La matrícula es obligatoria.";
}

if (!is_numeric($precio) || $precio <= 0) {
    $errores[] = "Precio no válido.";
}

if (empty($marca) || empty($modelo)) {
    $errores[] = "Marca y modelo son obligatorios.";
}

if (empty($producto)) {
    $errores[] = "Producto obligatorio.";
}

if (!empty($errores)) {
    $mensajeError = implode(" | ", $errores);
    echo json_encode([
        "error" => $mensajeError . " ⚠️ Corrige los errores y vuelve a darle a Calcular para actualizar los datos."
    ]);
    exit();
}

//Conexión a la BBDD
$conexion = new mysqli("localhost", "root", "", "presupuesto_auto");
if ($conexion->connect_error) {
    die(json_encode(["error" => "Conexión fallida: " . $conexion->connect_error]));
}

//Cliente
$consultaCliente = $conexion->prepare("SELECT id FROM cliente WHERE telefono = ?");
$consultaCliente->bind_param("s", $telefono);
$consultaCliente->execute();
$resultadoCliente = $consultaCliente->get_result();

if ($resultadoCliente->num_rows > 0) {
    $cliente = $resultadoCliente->fetch_assoc();
    $idCliente = $cliente['id'];
} else {
    $insertCliente = $conexion->prepare("INSERT INTO cliente (nombre, telefono, fecha_nacimiento, fecha_carnet, cp, anios_seguro, numero_partes) VALUES (?, ?, ?, ?, ?, ?, ?)");
    $insertCliente->bind_param("ssssiii", $nombre, $telefono, $fechaNacimiento, $fechaCarnet, $codigoPostal, $aniosSeguro, $numPartes);
    $insertCliente->execute();
    $idCliente = $insertCliente->insert_id;
}

//Coche
$consultaCoche = $conexion->prepare("SELECT id FROM coche WHERE matricula = ?");
$consultaCoche->bind_param("s", $matricula);
$consultaCoche->execute();
$resultadoCoche = $consultaCoche->get_result();

if ($resultadoCoche->num_rows > 0) {
    $coche = $resultadoCoche->fetch_assoc();
    $idCoche = $coche['id'];
} else {
    $consultaMarca = $conexion->prepare("SELECT id_marca FROM marcas WHERE nombre = ?");
    $consultaMarca->bind_param("s", $marca);
    $consultaMarca->execute();
    $resultadoMarca = $consultaMarca->get_result();
    $idMarca = $resultadoMarca->fetch_assoc()['id_marca'] ?? null;

    $consultaModelo = $conexion->prepare("SELECT id_modelo FROM modelos WHERE nombre = ?");
    $consultaModelo->bind_param("s", $modelo);
    $consultaModelo->execute();
    $resultadoModelo = $consultaModelo->get_result();
    $idModelo = $resultadoModelo->fetch_assoc()['id_modelo'] ?? null;

    if (!$idMarca || !$idModelo) {
        echo json_encode(["error" => "Marca o modelo no encontrado."]);
        exit();
    }

    $insertCoche = $conexion->prepare("INSERT INTO coche (matricula, anio, id_marca, id_modelo) VALUES (?, ?, ?, ?)");
    $insertCoche->bind_param("siii", $matricula, $anio, $idMarca, $idModelo);
    $insertCoche->execute();
    $idCoche = $insertCoche->insert_id;

    $conexion->query("INSERT INTO posee (id_cliente, id_coche) VALUES ($idCliente, $idCoche)");
}

//Producto y presupuesto
$consultaProducto = $conexion->prepare("SELECT id FROM producto WHERE nombre = ?");
$consultaProducto->bind_param("s", $producto);
$consultaProducto->execute();
$resultadoProducto = $consultaProducto->get_result();
$idProducto = ($resultadoProducto->num_rows > 0) ? $resultadoProducto->fetch_assoc()['id'] : null;

if ($idProducto) {
    $insertPresupuesto = $conexion->prepare("INSERT INTO presupuesto (id_cliente, matricula, id_producto, precio) VALUES (?, ?, ?, ?)");
    $insertPresupuesto->bind_param("isid", $idCliente, $matricula, $idProducto, $precio);
    $insertPresupuesto->execute();

    echo json_encode(["mensaje" => "Presupuesto guardado correctamente."]);
} else {
    echo json_encode(["error" => "Producto no encontrado."]);
}

$conexion->close();
?>
