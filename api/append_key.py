import rsa

priv = """-----BEGIN PRIVATE KEY-----
MIIEvwIBADANBgkqhkiG9w0BAQEFAASCBKkwggSlAgEAAoIBAQC4QQysjMY+Epv1
q9cAEG6SEd+KVmD1FyYEK9+U4SFOzLDbirkN6d5fvfjj6Rf+v2yeDqyL6sMi+ZCh
u6ROA53kooNlcvvtvj7V0V81Ha+8UHHGtxABzXYPPECtDlXJMQ+SOblYjccvCewQ
PiIyLv84CRq0bMU7IOxGBmt0sofe9VMdxk11O0t5P6Sq/mOZOAlIiJTeAuVZ7K/j
JvCW8egXQznEqb4IAV3t3lKOPqt9IE8caWRTcXRzFuetwKm2fcItXazVHuvEdXk7
4BDsJ7gK4oXgGe9VIe1d8eOpw6IMc4Yuha1xbd8BWn0fIW1upCSfUEGNKKauWkTj
Ob2LqP91AgMBAAECggEABAPieiuHXpvQ6CNFqDPAREpQhOcTR4Wb94XN1Yr4l8so
N64kqh8a6gFNpSIzrc9VynXD5uwN/6f3S3Fd6BeC/C2nCUT4JMSbTm7SV6nTf7Oz
rJ9zIUyGqNgIvPl9vy7+QzlWTTRDvBLuVCYVrS9iGOjCR/goOrzILh6rZOVG4DUo
GI+GVtgDIF1D/DXASkPu7TfDL41BNqFV9OCYXG7cEfY1iDf98+QEJUGTzdII5sCj
atLBrOjieqZ1JfQKyRqGY4lT/OBp6y6kz9oQPKmociAgmJ9vPNvSQiSv/Asbcay2
Y5oILPtnX1UjI5D3r8FNjS/A7JGEWBEIp7Vvh1V7AQKBgQD/p/gFhqw3Kt/6GWXr
a3lUETo8bxgCEVZphtoxu4RLc7bOdxWpUCc5XqLSwzkwYTVlNMUIHV5Kb5dCuilw
qeecAJkkTcZUhaUpb9HyqyzCngu0f7zc67r0wclyAiNUebyP1pIskufLnybNt6ar
ca5RscZwZaXhqdNAS9qHF/bKdQKBgQC4gH6YGXHksRuM3vRhoC9MTJOLncs6otvh
kHZKGsyf0Rdnas9tfwsilW4y9Oox13sQuFCj77UTh3L0GUMuoFoMB19eG4+fTbLM
fHZbEdQoaqXp7x10BCG2tslodmntzTHdU4dh0fPrzEzJIqUvuQHi7+K5euRTZGnr
2xGEjtDBAQKBgQD6trCmSrHs0CEiVXH780Piy5o+1fvHW1VQ26xzBR/yFqJ5y5L0
neQ5gLNQ2Z7l8Q66F4v6L0Le4JyIFaS6FgVKmdOVJKiRDxcvkbdksbWNjgyQkIyY
YpzPlpOFOM+I8nGW5agoClFDAOq+55GNpEh9WUfvxd9tdGv1K+48eaXOWQKBgQC2
w9KjqNEB0c+QxGshKiSwWErwSuc+toVJ9Gi5D8MTrXSZpVzFAsxs/cmkAKjdpq7p
6Ss4ugONzOc6lqvOTFnnAIagGn0zOSydE83KeObJApxIF+39NvqOnJL3QBW+0z1K
GaxKYkhWlJKbzA4GMCaGP0tAoVP8p8OlN+Uqgq6YAQKBgQDpurZOAmxFgRssJZod
opR6Tv0DmHEp/ntoL0+i54ARnY7586iZ19SLwQpPaRej49q7K3WL1A0c4En1kSdp
T6VECx0CddXh10yRj7npylGpRUbuiHJduYTG4omhA1UoFwaOikuejGBCEADZnZKY
z1fZSNvcNnLWmSkc9N3lmkOxtg==
-----END PRIVATE KEY-----"""

from cryptography.hazmat.primitives import serialization

key = serialization.load_pem_private_key(priv.encode('utf-8'), password=None)
pub = key.public_key()
pub_pem = pub.public_bytes(
    encoding=serialization.Encoding.PEM,
    format=serialization.PublicFormat.SubjectPublicKeyInfo
).decode('utf-8')

import os
with open('.env', 'r') as f:
    content = f.read()

if "GLOBAL_IT_PUBLIC_KEY" not in content:
    with open('.env', 'a') as f:
        f.write('\\nGLOBAL_IT_PUBLIC_KEY=\"' + pub_pem.replace('\\n', '\\\\n') + '\"\\n')
    print("Added GLOBAL_IT_PUBLIC_KEY to .env")
else:
    print("GLOBAL_IT_PUBLIC_KEY already in .env")
