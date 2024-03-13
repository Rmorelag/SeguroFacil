<?php
require __DIR__ . '/vendor/autoload.php';

use Dompdf\Dompdf;

$conexion = new mysqli("localhost", "root", "", "presupuesto_auto");
if ($conexion->connect_error) {
    die("Error de conexión: " . $conexion->connect_error);
}

$id = intval($_GET['id_presupuesto'] ?? 0);
if ($id <= 0) {
    die("ID de presupuesto no válido");
}

$query = "
    SELECT 
        cliente.nombre,
        cliente.apellidos,
        cliente.email,
        cliente.telefono,
        cliente.cp,
        cliente.direccion,
        poliza.fecha_contratacion,
        poliza.producto,
        poliza.importe_total,
        presupuesto.matricula,
        coche.id_modelo,
        modelos.nombre AS modelo,
        marcas.nombre AS marca
    FROM poliza
    JOIN cliente ON cliente.id = poliza.id_cliente
    JOIN presupuesto ON presupuesto.id = poliza.id_presupuesto
    JOIN coche ON presupuesto.matricula = coche.matricula
    LEFT JOIN modelos ON coche.id_modelo = modelos.id_modelo
    LEFT JOIN marcas ON modelos.id_marca = marcas.id_marca
    WHERE poliza.id_presupuesto = ?
";

$stmt = $conexion->prepare($query);
$stmt->bind_param("i", $id);
$stmt->execute();
$res = $stmt->get_result();

if ($res->num_rows === 0) {
    die("No se encontró la póliza para el presupuesto proporcionado.");
}

$data = $res->fetch_assoc();

$logoPath = __DIR__ . '/img/logo.jpg';

if (!file_exists($logoPath)) {
    die('Error: La imagen del logo no se encuentra en la ruta ' . $logoPath);
}

$logoData = base64_encode(file_get_contents($logoPath));
$logoSrc = 'data:image/png;base64,' . $logoData;
//Construimos el HTML con el logo y los datos
$html = '
    <div style="margin-bottom: 20px;">
      <img src="' . $logoSrc . '" alt="Logo Seguro Fácil" style="max-width: 150px;">
    </div>

    <h1 style="text-align: center;">Seguro Fácil</h1>
    <h2 style="text-align: center;">Resumen de Póliza</h2>
    <hr>
    <h3>Datos del cliente</h3>
    <p><strong>Nombre:</strong> ' . htmlspecialchars($data['nombre'] . ' ' . $data['apellidos']) . '</p>
    <p><strong>Teléfono:</strong> ' . htmlspecialchars($data['telefono']) . '</p>
    <p><strong>Email:</strong> ' . htmlspecialchars($data['email']) . '</p>
    <p><strong>Dirección:</strong> ' . htmlspecialchars($data['direccion']) . ' (CP: ' . htmlspecialchars($data['cp']) . ')</p>

    <h3>Vehículo</h3>
    <p><strong>Marca:</strong> ' . htmlspecialchars($data['marca'] ?? 'N/D') . '</p>
    <p><strong>Modelo:</strong> ' . htmlspecialchars($data['modelo'] ?? 'N/D') . '</p>
    <p><strong>Matrícula:</strong> ' . htmlspecialchars($data['matricula']) . '</p>

    <h3>Póliza</h3>
    <p><strong>Producto:</strong> ' . htmlspecialchars($data['producto']) . '</p>
    <p><strong>Fecha de contratación:</strong> ' . htmlspecialchars($data['fecha_contratacion']) . '</p>
    <p><strong>Importe total:</strong> ' . number_format($data['importe_total'], 2) . ' €</p>

    <hr>
    <p style="text-align: center;">Gracias por confiar en Seguro Fácil</p>
';

$dompdf = new Dompdf();
$dompdf->loadHtml($html);
$dompdf->setPaper('A4', 'portrait');
$dompdf->render();
$dompdf->stream("poliza_{$id}.pdf", ["Attachment" => false]); // false = inline
?>
