<?php
$host = "localhost";
$user = "root";
$pass = "";
$db = "aqms_db";

$conn = new mysqli($host, $user, $pass, $db);
if ($conn->connect_error) {
  die(json_encode(['error' => "Connection failed: " . $conn->connect_error]));
}

$interval = $_GET['interval'] ?? 'hour';
$date = $_GET['date'] ?? null;

if ($interval === 'hour' && $date) {
  $query = $conn->prepare("
    SELECT DATE_FORMAT(recorded_at, '%H:00') as label,
           AVG(pm25) as pm25,
           AVG(mq135) as mq135,
           AVG(temperature) as temperature,
           AVG(humidity) as humidity
    FROM aqms_logs
    WHERE DATE(recorded_at) = ?
    GROUP BY HOUR(recorded_at)
    ORDER BY HOUR(recorded_at) ASC
  ");
  $query->bind_param("s", $date);
  $query->execute();
  $result = $query->get_result();
} elseif ($interval === 'day') {
  $query = "
    SELECT DATE(recorded_at) as label,
           AVG(pm25) as pm25,
           AVG(mq135) as mq135,
           AVG(temperature) as temperature,
           AVG(humidity) as humidity
    FROM aqms_logs
    GROUP BY DATE(recorded_at)
    ORDER BY DATE(recorded_at) ASC
    LIMIT 30
  ";
  $result = $conn->query($query);
} else {
  $query = "
    SELECT DATE(recorded_at) as label,
           AVG(pm25) as pm25,
           AVG(mq135) as mq135,
           AVG(temperature) as temperature,
           AVG(humidity) as humidity
    FROM aqms_logs
    GROUP BY DATE(recorded_at)
    ORDER BY DATE(recorded_at) ASC
    LIMIT 30
  ";
  $result = $conn->query($query);
}

$data = [];
while($row = $result->fetch_assoc()) {
  $row['pm25'] = (float) $row['pm25'];
  $row['mq135'] = (float) $row['mq135'];
  $row['temperature'] = (float) $row['temperature'];
  $row['humidity'] = (float) $row['humidity'];
  $data[] = $row;
}

header('Content-Type: application/json');
echo json_encode($data);

$conn->close();
?>
