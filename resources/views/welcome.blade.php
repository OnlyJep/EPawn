<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="X-UA-Compatible" content="ie=edge">
    <title>E-Pawn | Save Smart • Spend Wise</title>
    <link rel="stylesheet" href="{{ mix('css/app.css') }}">
    <link rel="icon" type="image/png" href="{{ asset('img/EPAWNlogo.png') }}">
    <script>
        (function() {
            try {
                const storedTheme = localStorage.getItem('epawn-theme') || 'light';
                document.documentElement.setAttribute('data-theme', storedTheme);
            } catch(e) {
                document.documentElement.setAttribute('data-theme', 'light');
            }
        })();
    </script>
</head>
<body>
    <div id="root"></div>
    <script src="{{ mix('js/app.js') }}"></script>
</body>
</html>
