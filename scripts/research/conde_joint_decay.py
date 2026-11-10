#!/usr/bin/env python3
"""Teste de identificabilidade, nao reconstrucao SGP4 de reentrada.

Modelo exponencial de densidade, orbitas circulares e escala H comum.
Cada objeto recebe k proprio; as datas de reentrada nao sao longitude.
Sem dependencias externas: python3 scripts/research/conde_joint_decay.py
"""
from datetime import datetime, timezone
from math import pi, sqrt, exp

MU = 398600.4418  # km^3/s^2
RE = 6378.137      # km
H_END = 120.0      # km, HIPOTESE, nao observacao
OBJECTS = [
    # nome, ultimo TLE (UTC), dia da reentrada hipotetica ao meio-dia, n_0 (rev/dia)
    ("528", "1963-10-27T14:40:16+00:00", "1963-11-08T12:00:00+00:00", 15.74901460),
    ("529", "1963-12-30T11:25:41+00:00", "1963-12-31T12:00:00+00:00", 16.09825765),
    ("527", "1969-01-08T12:44:15+00:00", "1969-01-09T12:00:00+00:00", 16.32827153),
]

def altitude(n):
    omega = n * 2 * pi / 86400
    return (MU / omega**2)**(1 / 3) - RE

def simpson(f, a, b, steps=10000):
    assert steps % 2 == 0
    dx = (b - a) / steps
    s = f(a) + f(b)
    for j in range(1, steps):
        s += (4 if j % 2 else 2) * f(a + j * dx)
    return s * dx / 3

def fit(n0, duration_days, H):
    terminal_n = 86400 / (2 * pi) * sqrt(MU / (RE + H_END)**3)
    # dn/dt = k * (n/n0)^(4/3) * exp((h0 - h)/H)
    def integrand(n):
        return (n0 / n)**(4 / 3) * exp((altitude(n) - altitude(n0)) / H)
    # k obtido DA data, nao validado contra um dado independente.
    return simpson(integrand, n0, terminal_n) / duration_days

print("Resultado condicionado: terminal 120 km, hora da reentrada nao conhecida.")
print("Cada k e ajustado separadamente: reproduzir a data NAO valida o modelo.")
for H in (30.0, 50.0, 70.0):
    print(f"Escala atmosferica H={H:.0f} km")
    for ident, epoch, end, n0 in OBJECTS:
        duration = (datetime.fromisoformat(end) - datetime.fromisoformat(epoch)).total_seconds() / 86400
        print(f"  {ident}: duracao={duration:.3f} dias; altitude_TLE={altitude(n0):.1f} km; "
              f"k={fit(n0, duration, H):.5f} rev/dia²")
