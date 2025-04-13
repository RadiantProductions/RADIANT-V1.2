<!-- login.php -->
<!DOCTYPE html>
<html>
<head>
  <title>Login</title>
  <style>
    body {
      margin: 0;
      font-family: Arial, sans-serif;
    }
    .container {
      display: flex;
      flex-direction: row;
      height: 100vh;
    }
    .image-section {
      flex: 1;
      background: url('https://us-east-1.tixte.net/uploads/cdn.radiantradios.xyz/transmitter.png') no-repeat center center;
      background-size: cover;
    }
    .login-section {
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: center;
      background-color: black;
      color: white;
    }
    form {
      width: 300px;
      color: white;
    }
    input {
      width: 100%;
      padding: 10px;
      margin: 8px 0;
      color: white;
      background-color: #222;
      border: 1px solid #555;
    }
    input[type="submit"] {
      background-color: grey;
      color: white;
      border: none;
      cursor: pointer;
    }

    @media (max-width: 768px) {
      .container {
        flex-direction: column;
      }
      .login-section, .image-section {
        height: 50vh;
      }
    }
  </style>
</head>
<body>

<div class="container">
  <div class="login-section">
    <form method="post" action="login.php">
      <h2>Login</h2>
      <input type="text" name="username" placeholder="Username" required>
      <input type="password" name="password" placeholder="Password" required>
      <input type="submit" name="login" value="Login">
    </form>
  </div>
  <div class="image-section"></div>
</div>

<?php
if ($_SERVER["REQUEST_METHOD"] == "POST") {
  $user = $_POST['username'];
  $pass = $_POST['password'];

  // Dummy check
  if ($user === 'admin' && $pass === 'password') {
    echo "<script>alert('Login Successful');</script>";
  } else {
    echo "<script>alert('Invalid Credentials');</script>";
  }
}
?>

</body>
</html>
