<?php
header("Content-Type: application/json");

$host = "localhost";
$user = "root";
$password = "";
$database = "presupuesto_auto";

//Conectamos a la base de datos
$conn = new mysqli($host, $user, $password, $database);
if ($conn->connect_error) {
    die(json_encode(["error" => "Error en la conexión: " . $conn->connect_error]));
}

$accion = $_GET["accion"] ?? "";

if ($accion == "marcas") {
    //Obtenemos todas las marcas
    $sql = "SELECT nombre FROM marcas ORDER BY nombre";
    $result = $conn->query($sql);
    $marcas = [];
    while ($row = $result->fetch_assoc()) {
        $marcas[] = $row["nombre"];
    }
    echo json_encode($marcas);

} elseif ($accion == "modelos" && isset($_GET["marca"])) {
    $marca = $conn->real_escape_string($_GET["marca"]);
    //Obtenemos los modelos para la marca seleccionada
    $sql = "SELECT nombre FROM modelos WHERE id_marca = (SELECT id_marca FROM marcas WHERE nombre = '$marca')";
    $result = $conn->query($sql);
    $modelos = [];
    while ($row = $result->fetch_assoc()) {
        $modelos[] = $row["nombre"];
    }
    echo json_encode($modelos);

} elseif ($accion == "recargoMarca" && isset($_GET["marca"])) {
    $marca = $conn->real_escape_string($_GET["marca"]);
    //Obtenemos el recargo correspondiente a la marca
    $sql = "SELECT recargo FROM marcas WHERE nombre = '$marca'";
    $result = $conn->query($sql);
    if ($row = $result->fetch_assoc()) {
        echo json_encode(["recargo" => floatval($row["recargo"])]);
    } else {
        echo json_encode(["recargo" => 0]);
    }

} else {
    echo json_encode(["error" => "Acción no válida"]);
}

$conn->close();
