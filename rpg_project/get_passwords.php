<?php
header('Content-Type: application/json');

// Set timezone to Asia/Kolkata for consistency
date_default_timezone_set('Asia/Kolkata');

$servername = "localhost";
$username = "root";
$password = "";
$dbname = "rpg_db";

try {
    $conn = new mysqli($servername, $username, $password, $dbname);
    if ($conn->connect_error) {
        throw new Exception("Connection failed: " . $conn->connect_error);
    }

    $email = isset($_POST['email']) ? $conn->real_escape_string($_POST['email']) : '';
    if (empty($email)) {
        throw new Exception("Email is required.");
    }

    $stmt = $conn->prepare("SELECT * FROM password_records WHERE email = ? ORDER BY date DESC, time DESC");
    $stmt->bind_param("s", $email);
    $stmt->execute();
    $result = $stmt->get_result();

    $passwords = [];
    while ($row = $result->fetch_assoc()) {
        $passwords[] = $row;
    }

    echo json_encode($passwords);

    $stmt->close();
    $conn->close();
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => $e->getMessage()]);
}
?>