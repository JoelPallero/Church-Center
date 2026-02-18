FROM php:8.2-apache

# Extensiones necesarias
RUN docker-php-ext-install pdo pdo_mysql mysqli

# Habilitar mod_rewrite de Apache
RUN a2enmod rewrite

# Cambiar DocumentRoot a la carpeta pública
RUN sed -i 's|DocumentRoot /var/www/html|DocumentRoot /var/www/html/public|' /etc/apache2/sites-available/000-default.conf

# Copiar composer si necesitás, por ejemplo
# COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

EXPOSE 80

CMD ["apache2-foreground"]
