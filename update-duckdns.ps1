$token = "976bcbdd-5051-44b0-81dc-a92e1fd1849d"
$domain = "universoazorin"
Invoke-WebRequest -Uri "https://www.duckdns.org/update?domains=$domain&token=$token&ip=" -UseBasicParsing