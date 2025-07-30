<?php
use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;

require __DIR__ . '/src/Exception.php';
require __DIR__ . '/src/PHPMailer.php';
require __DIR__ . '/src/SMTP.php';

if (file_exists(__DIR__ . '/.env')) {
    $lines = file(__DIR__ . '/.env', FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    foreach ($lines as $line) {
        if (strpos(trim($line), '#') === 0) {
            continue;
        }
        
        if (strpos($line, '=') !== false) {
            list($name, $value) = explode('=', $line, 2);
            $name = trim($name);
            $value = trim($value);
            
            if (!array_key_exists($name, $_ENV)) {
                $_ENV[$name] = $value;
            }
            if (!getenv($name)) {
                putenv(sprintf('%s=%s', $name, $value));
            }
        }
    }
}

header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Content-Type: application/json");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method not allowed']);
    exit();
}

$host = $_ENV['DB_HOST'] ?? getenv('DB_HOST') ?? 'localhost';
$dbname = $_ENV['DB_NAME'] ?? getenv('DB_NAME') ?? 'contact_form';
$db_username = $_ENV['DB_USERNAME'] ?? getenv('DB_USERNAME') ?? 'root';
$db_password = $_ENV['DB_PASSWORD'] ?? getenv('DB_PASSWORD') ?? '';

$to_email = $_ENV['TO_EMAIL'] ?? getenv('TO_EMAIL') ?? 'applymor@gmail.com';
$from_email = $_ENV['FROM_EMAIL'] ?? getenv('FROM_EMAIL') ?? 'noreply@moraassociates.com';
$from_name = $_ENV['FROM_NAME'] ?? getenv('FROM_NAME') ?? 'MOR & Associates Website';

$smtp_username = $_ENV['SMTP_USERNAME'] ?? getenv('SMTP_USERNAME');
$smtp_password = $_ENV['SMTP_PASSWORD'] ?? getenv('SMTP_PASSWORD');
$smtp_host = $_ENV['SMTP_HOST'] ?? getenv('SMTP_HOST') ?? 'smtp.gmail.com';
$smtp_port = $_ENV['SMTP_PORT'] ?? getenv('SMTP_PORT') ?? 587;

if (empty($smtp_username) || empty($smtp_password)) {
    error_log("Missing SMTP credentials");
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Server configuration error. Please contact administrator.'
    ]);
    exit();
}

try {
    $input = file_get_contents('php://input');
    $data = json_decode($input, true);
    
    if (json_last_error() !== JSON_ERROR_NONE) {
        throw new Exception("Invalid JSON data");
    }
    
    $required_fields = ['name', 'email', 'service', 'message'];
    foreach ($required_fields as $field) {
        if (empty($data[$field])) {
            throw new Exception("Field '$field' is required");
        }
    }
    
    if (!filter_var($data['email'], FILTER_VALIDATE_EMAIL)) {
        throw new Exception("Invalid email format");
    }
    
    $name = htmlspecialchars(trim($data['name']), ENT_QUOTES, 'UTF-8');
    $email = htmlspecialchars(trim($data['email']), ENT_QUOTES, 'UTF-8');
    $phone = isset($data['phone']) ? htmlspecialchars(trim($data['phone']), ENT_QUOTES, 'UTF-8') : '';
    $company = isset($data['company']) ? htmlspecialchars(trim($data['company']), ENT_QUOTES, 'UTF-8') : '';
    $service = htmlspecialchars(trim($data['service']), ENT_QUOTES, 'UTF-8');
    $message = htmlspecialchars(trim($data['message']), ENT_QUOTES, 'UTF-8');
    
    if (strlen($name) > 100) throw new Exception("Name is too long (maximum 100 characters)");
    if (strlen($email) > 150) throw new Exception("Email is too long (maximum 150 characters)");
    if (strlen($phone) > 20) throw new Exception("Phone number is too long (maximum 20 characters)");
    if (strlen($company) > 100) throw new Exception("Company name is too long (maximum 100 characters)");
    if (strlen($service) > 100) throw new Exception("Service field is too long (maximum 100 characters)");
    if (strlen($message) > 2000) throw new Exception("Message is too long (maximum 2000 characters)");
    
    $dsn = "mysql:host=$host;dbname=$dbname;charset=utf8mb4";
    $options = [
        PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES   => false,
    ];
    
    $pdo = new PDO($dsn, $db_username, $db_password, $options);
    
    $stmt = $pdo->prepare("INSERT INTO contacts (name, email, phone, company, service, message, created_at) VALUES (?, ?, ?, ?, ?, ?, NOW())");
    $stmt->execute([$name, $email, $phone, $company, $service, $message]);
    
    $contact_id = $pdo->lastInsertId();
    
    $subject = "New Contact Form Submission - MOR & Associates";
    $email_body = "
    <html>
    <head>
        <title>New Contact Form Submission</title>
        <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #00838f; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background-color: #f8fafc; padding: 20px; }
            .field { margin-bottom: 15px; }
            .label { font-weight: bold; color: #1e293b; }
            .value { margin-top: 5px; padding: 10px; background-color: white; border-left: 4px solid #01acc1; border-radius: 4px; }
            .footer { background-color: #1e293b; color: white; padding: 15px; text-align: center; font-size: 12px; border-radius: 0 0 8px 8px; }
        </style>
    </head>
    <body>
        <div class='container'>
            <div class='header'>
                <h2>New Contact Form Submission</h2>
                <p>MOR & Associates Website</p>
            </div>
            <div class='content'>
                <div class='field'>
                    <div class='label'>Contact ID:</div>
                    <div class='value'>#$contact_id</div>
                </div>
                <div class='field'>
                    <div class='label'>Name:</div>
                    <div class='value'>$name</div>
                </div>
                <div class='field'>
                    <div class='label'>Email:</div>
                    <div class='value'>$email</div>
                </div>";
    
    if (!empty($phone)) {
        $email_body .= "
                <div class='field'>
                    <div class='label'>Phone:</div>
                    <div class='value'>$phone</div>
                </div>";
    }
    
    if (!empty($company)) {
        $email_body .= "
                <div class='field'>
                    <div class='label'>Company:</div>
                    <div class='value'>$company</div>
                </div>";
    }
    
    $email_body .= "
                <div class='field'>
                    <div class='label'>Service Interested In:</div>
                    <div class='value'>$service</div>
                </div>
                <div class='field'>
                    <div class='label'>Message:</div>
                    <div class='value'>" . nl2br($message) . "</div>
                </div>
                <div class='field'>
                    <div class='label'>Submitted:</div>
                    <div class='value'>" . date('Y-m-d H:i:s') . "</div>
                </div>
            </div>
            <div class='footer'>
                <p>This email was automatically generated from the MOR & Associates website contact form.</p>
                <p>Please respond to the client directly at: $email</p>
            </div>
        </div>
    </body>
    </html>";
    
    $mail = new PHPMailer(true);
    $email_sent = false;
    $email_error = '';

    try {
        $mail->clearAllRecipients();
        $mail->clearAttachments();
        
        $mail->isSMTP();
        $mail->Host       = $smtp_host;
        $mail->SMTPAuth   = true;
        $mail->Username   = $smtp_username;
        $mail->Password   = $smtp_password;
        $mail->SMTPSecure = PHPMailer::ENCRYPTION_STARTTLS;
        $mail->Port       = $smtp_port;
        
        $mail->SMTPOptions = array(
            'ssl' => array(
                'verify_peer' => false,
                'verify_peer_name' => false,
                'allow_self_signed' => true
            )
        );
        
        $mail->Timeout = 60;
        
        $mail->setFrom($smtp_username, $from_name);
        $mail->addAddress($to_email);
        $mail->addReplyTo($email, $name);

        $mail->isHTML(true);
        $mail->Subject = $subject;
        $mail->Body    = $email_body;
        
        $mail->AltBody = strip_tags(str_replace('<br>', "\n", $email_body));

        if ($mail->send()) {
            $email_sent = true;
            error_log("Email sent successfully for contact ID: $contact_id");
        } else {
            $email_sent = false;
            $email_error = $mail->ErrorInfo;
            error_log("Email failed to send: " . $mail->ErrorInfo);
        }
        
    } catch (Exception $e) {
        $email_error = $e->getMessage();
        error_log("Email exception: " . $e->getMessage());
        error_log("PHPMailer Error Info: " . $mail->ErrorInfo);
        $email_sent = false;
    }

    $response = [
        'success' => true,
        'message' => 'Thank you for your message! We will get back to you soon.',
        'contact_id' => $contact_id,
        'email_sent' => $email_sent
    ];
    
    if (!$email_sent && !empty($email_error)) {
        $response['email_error'] = $email_error;
        error_log("Email sending failed for contact ID $contact_id: $email_error");
    }
    
    echo json_encode($response);
    
} catch (PDOException $e) {
    error_log("Database error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Database error occurred. Please try again later.'
    ]);
} catch (Exception $e) {
    error_log("General error: " . $e->getMessage());
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'message' => $e->getMessage()
    ]);
}
?>
