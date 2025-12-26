<?php
header('Content-Type: application/json');

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

    
    $name = isset($_POST['name']) ? $conn->real_escape_string($_POST['name']) : '';
    $email = isset($_POST['email']) ? $conn->real_escape_string($_POST['email']) : '';
    $mobile = isset($_POST['mobile']) ? $conn->real_escape_string($_POST['mobile']) : null;
    $password = isset($_POST['password']) ? $conn->real_escape_string($_POST['password']) : '';
    $entropy = isset($_POST['entropy']) ? floatval($_POST['entropy']) : 0;
    $date = date("Y-m-d");
    $time = date("H:i:s");

    if (empty($name) || empty($email) || empty($password)) {
        throw new Exception("Name, email, and password are required.");
    }

    $stmt = $conn->prepare("INSERT INTO password_records (name, email, mobile, password, entropy, date, time) VALUES (?, ?, ?, ?, ?, ?, ?)");
    $stmt->bind_param("ssssdss", $name, $email, $mobile, $password, $entropy, $date, $time);

    if ($stmt->execute()) {
        echo json_encode(['success' => true, 'message' => 'Password and user data saved successfully']);
    } else {
        throw new Exception("Error executing query: " . $stmt->error);
    }

    $stmt->close();
    $conn->close();
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => $e->getMessage()]);
}
?>