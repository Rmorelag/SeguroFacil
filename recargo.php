<?php

$host = 'localhost';
$username = 'root';
$password = '';
$dbname = 'presupuesto_auto';

//Establecemos conexión
try {
    $pdo = new PDO("mysql:host=$host;dbname=$dbname", $username, $password);
    //Se configuran PDO para lanzar excepciones en caso de error
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
} catch (PDOException $e) {
    //Si ocurre un error en la conexión, lo mostramos
    die("Error de conexión a la base de datos: " . $e->getMessage());
}

//Rescatamos el código postal de la solicitud
$codigoPostal = isset($_GET['codigoPostal']) ? $_GET['codigoPostal'] : null;
//Consultamos si está en la BBDD
if ($codigoPostal) {
    try {
        //Comrpobamos el recargo utilizando la columna correcta 'cp'
        $query = "SELECT recargo FROM codigo_postal WHERE cp = ?";
        $stmt = $pdo->prepare($query);
        $stmt->execute([$codigoPostal]);
        $row = $stmt->fetch(PDO::FETCH_ASSOC);

        if ($row) {
            //Si se encuentra el recargo, lo enviamos como respuesta en formato JSON
            echo json_encode(['recargo' => $row['recargo']]);
        } else {
            //Si no se encuentra el código postal, devolvemos recargo 0
            echo json_encode(['recargo' => 0]);
        }
    } catch (PDOException $e) {
        //Si ocurre un error al ejecutar la consulta, lo mostramos
        echo json_encode(['error' => 'Error en la consulta SQL: ' . $e->getMessage()]);
    }
} else {
    //Si no se recibe el código postal, devolvemos recargo 0
    echo json_encode(['recargo' => 0]);
}
?>
