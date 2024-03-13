<?php

$host = 'localhost';
$username = 'root';
$password = ""; 
$dbname = 'presupuesto_auto';

// Crear la conexión
try {
    $pdo = new PDO("mysql:host=$host;dbname=$dbname", $username, $password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
} catch (PDOException $e) {
    //En caso de error de conexión, devolvemos un mensaje de error JSON
    header('Content-Type: application/json');
    echo json_encode(["error" => "Error de conexión: " . $e->getMessage()]);
    exit();
}

//Consultamos los productos
$query = 'SELECT nombre, descripcion, precio FROM producto';
$stmt = $pdo->query($query);

//Se verifica si la consulta devuelve resultados
if ($stmt) {
    $productos = [];
    while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
        $productos[] = $row;
    }

    //Devuelve los resultados en formato JSON
    header('Content-Type: application/json');
    echo json_encode($productos);
} else {
    //En caso de error en la consulta, devuelve un mensaje de error JSON
    header('Content-Type: application/json');
    echo json_encode(["error" => "Error al ejecutar la consulta SQL"]);
}
?>
