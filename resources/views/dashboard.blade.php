<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="X-UA-Compatible" content="ie=edge">
    <title>Dashboard — E-PAWN</title>
    <link rel="stylesheet" href="{{ mix('css/dashboard.css') }}">
    <link rel="icon" type="image/png" href="{{ asset('img/EPAWNlogo.png') }}">
    <script>
        (function() {
            try {
                var t = localStorage.getItem('epawn-theme');
                var theme = (t === 'dark' || t === 'light') ? t : 'light';
                document.documentElement.setAttribute('data-theme', theme);
            } catch(e) {
                document.documentElement.setAttribute('data-theme', 'light');
            }
        })();
    </script>
</head>
<body>
    <div id="dashboard-root"></div>
    <script src="{{ mix('js/dashboard.js') }}"></script>
</body>
</html>
