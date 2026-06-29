const mix = require('laravel-mix');

mix.js('resources/js/app.js', 'public/js')
    .js('resources/js/dashboard/app.js', 'public/js/dashboard.js')
    .js('resources/js/admin/app.js', 'public/js/admin.js')
    .react()
    .sass('resources/css/app.scss', 'public/css')
    .sass('resources/css/dashboard.scss', 'public/css')
    .sass('resources/css/admin/admin.scss', 'public/css/admin.css');
