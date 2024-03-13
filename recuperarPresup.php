<?php
error_reporting(E_ALL);
ini_set('display_errors', 1);
header('Content-Type: application/json');

$conexion = new mysqli("localhost", "root", "", "presupuesto_auto");
if ($conexion->connect_error) {
    http_response_code(500);
    echo json_encode(["error" => "Conexión fallida: " . $conexion->connect_error]);
    exit();
}

$datos = json_decode(file_get_contents("php://input"), true);

// Validación: matrícula obligatoria
if (!$datos || empty($datos['matricula'])) {
    http_response_code(400);
    echo json_encode(["error" => "Matrícula no proporcionada"]);
    exit();
}

// Validación: teléfono con formato válido (9 dígitos)
if (empty($datos['telefono']) || !preg_match('/^[0-9]{9}$/', $datos['telefono'])) {
    http_response_code(400);
    echo json_encode(["error" => "Teléfono no válido"]);
    exit();
}

$matricula = $datos['matricula'];
$telefono = $datos['telefono'];

$query = "SELECT 
        presupuesto.id AS id,  
        presupuesto.matricula,
        presupuesto.precio,
        producto.nombre AS producto_nombre,
        producto.descripcion AS producto_descripcion,
        coche.anio AS coche_anio,
        marcas.nombre AS marca,
        modelos.nombre AS modelo,
        cliente.nombre AS cliente_nombre,
        cliente.telefono,
        DATE_FORMAT(cliente.fecha_nacimiento, '%d-%m-%Y') AS fecha_nacimiento,
        DATE_FORMAT(cliente.fecha_carnet, '%d-%m-%Y') AS fecha_carnet,
        cliente.cp,
        cliente.anios_seguro,
        cliente.numero_partes
    FROM presupuesto
    JOIN coche ON presupuesto.matricula = coche.matricula
    LEFT JOIN modelos ON coche.id_marca = modelos.id_modelo
    LEFT JOIN marcas ON modelos.id_marca = marcas.id_marca
    LEFT JOIN cliente ON presupuesto.id_cliente = cliente.id
    LEFT JOIN producto ON presupuesto.id_producto = producto.id
    WHERE presupuesto.matricula = ?";

$stmt = $conexion->prepare($query);
if (!$stmt) {
    http_response_code(500);
    echo json_encode(["error" => "Error preparando consulta: " . $conexion->error]);
    exit();
}

$stmt->bind_param("s", $matricula);
$stmt->execute();
$resultado = $stmt->get_result();

if ($resultado->num_rows === 0) {
    http_response_code(404);
    echo json_encode(["error" => "No se encontraron presupuestos para la matrícula " . $matricula]);
    exit();
}

$presupuestos = [];
while ($fila = $resultado->fetch_assoc()) {
    $presupuestos[] = $fila;
}

echo json_encode($presupuestos);

$stmt->close();
$conexion->close();
?>
