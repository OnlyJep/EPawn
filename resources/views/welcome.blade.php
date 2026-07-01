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
    @php
        $__user = Auth::check() ? Auth::user()->load('profile') : null;
        $__errors = session('errors') ? session('errors')->getMessages() : [];
        $__openModal = '';
        if (!empty($__errors)) {
            $__openModal = isset($__errors['login']) ? 'login' : 'register';
        } elseif (session('open_modal')) {
            $__openModal = session('open_modal');
        }
        $__routes = [
            'home' => url('/'),
            'features' => url('/features'),
            'howItWorks' => url('/how-it-works'),
            'about' => url('/about'),
            'helpCenter' => url('/help-center'),
            'privacyPolicy' => url('/privacy-policy'),
            'termsOfService' => url('/terms-of-service'),
            'login' => url('/api/login'),
            'register' => url('/api/register'),
            'logout' => url('/api/logout'),
            'dashboard' => url('/dashboard'),
        ];
    @endphp
    <div id="root"
         data-user='@json($__user)'
         data-logo="{{ asset('img/EPAWNlogo.png') }}"
         data-csrf="{{ csrf_token() }}"
         data-routes='@json($__routes)'
         data-errors='@json($__errors)'
         data-old='@json(session()->getOldInput())'
         data-open-modal="{{ $__openModal }}"
         data-year="{{ (int) date('Y') }}"></div>
    <script src="{{ mix('js/app.js') }}"></script>
</body>
</html>
