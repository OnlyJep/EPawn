<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Admin Portal - Epawn</title>
    <meta name="csrf-token" content="{{ csrf_token() }}">
    <link rel="stylesheet" href="{{ mix('css/admin.css') }}">
</head>
<body>
    <div id="admin-root"></div>
    <script src="{{ mix('js/admin.js') }}"></script>
</body>
</html>
