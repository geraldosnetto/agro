#!/bin/bash
feeds=(
  "https://www.agrolink.com.br/rss/noticias.xml"
  "https://www.comprerural.com/feed/"
  "https://suisite.com.br/feed/"
  "https://avisite.com.br/feed/"
  "https://ovosite.com.br/feed/"
  "https://planetaarroz.com.br/feed/"
  "https://agnocafe.com.br/feed/"
  "https://www.aquaculturebrasil.com.br/feed/"
  "https://agrimidia.com.br/feed/"
  "https://www.beefpoint.com.br/feed/"
  "https://www.portaldbo.com.br/feed/"
  "https://revistacafeicultura.com.br/feed/"
  "https://www.jornalcana.com.br/feed/"
)
for feed in "${feeds[@]}"; do
  echo "Testing $feed"
  curl -s -I "$feed" | grep HTTP
done
