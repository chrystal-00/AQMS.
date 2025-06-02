<?php
$host = "localhost";
$user = "root";
$pass = "";
$db = "aqms_db";

$conn = new mysqli($host, $user, $pass, $db);
if ($conn->connect_error) {
  die("Connection failed: " . $conn->connect_error);
}

$pm25 = $_GET['pm25'];
$mq135 = $_GET['mq135'];
$temp = $_GET['temp'];
$humidity = $_GET['humidity'];

$sql = "INSERT INTO aqms_logs (pm25, mq135, temperature, humidity) VALUES ('$pm25', '$mq135', '$temp', '$humidity')";
if ($conn->query($sql) === TRUE) {
  echo "Inserted";
} else {
  echo "Error: " . $conn->error;
}
$conn->close();
?>