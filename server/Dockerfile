# Local stand-in for shared PHP hosting: Apache + PHP with the extensions Hostinger has on by default.
FROM php:8.3-apache
RUN apt-get update && apt-get install -y --no-install-recommends libjpeg-dev libpng-dev libwebp-dev \
 && docker-php-ext-configure gd --with-jpeg --with-webp \
 && docker-php-ext-install -j"$(nproc)" gd pdo_mysql exif \
 && a2enmod rewrite headers \
 && sed -ri 's/AllowOverride None/AllowOverride All/g' /etc/apache2/apache2.conf \
 && printf 'upload_max_filesize=16M\npost_max_size=18M\nmemory_limit=256M\n' > /usr/local/etc/php/conf.d/uploads.ini \
 && rm -rf /var/lib/apt/lists/*
