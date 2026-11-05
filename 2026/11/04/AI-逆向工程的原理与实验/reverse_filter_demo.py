"""Synthetic black-box recovery demo; Python standard library only."""
import math
import random


def teaching_black_box(rgb):
    # Disclosed for reproducibility. recover() never reads these parameters.
    r, g, b = (value ** 2 for value in rgb)
    return (0.02 + 0.80*r + 0.10*g + 0.02*b,
            0.03 + 0.05*r + 0.75*g + 0.05*b,
            0.04 + 0.02*r + 0.08*g + 0.78*b)


def recover(query):
    bias = query((0.0, 0.0, 0.0))
    basis = [(1.0, 0.0, 0.0),
             (0.0, 1.0, 0.0),
             (0.0, 0.0, 1.0)]
    outputs = [query(x) for x in basis]
    matrix = [[outputs[j][i] - bias[i]
               for j in range(3)] for i in range(3)]
    mid = query((0.5, 0.0, 0.0))
    ratio = (mid[0] - bias[0]) / matrix[0][0]
    gamma = math.log(ratio) / math.log(0.5)

    def predict(rgb):
        curved = [v ** gamma for v in rgb]
        return tuple(bias[i] + sum(matrix[i][j] * curved[j]
                     for j in range(3)) for i in range(3))

    return gamma, predict


def main():
    gamma, predict = recover(teaching_black_box)
    actual_mid = teaching_black_box((0.5, 0.0, 0.0))
    wrong_mid = (0.42, 0.055, 0.05)
    wrong_error = max(abs(a-b) for a, b in zip(actual_mid, wrong_mid))
    rng = random.Random(20261104)
    samples = [tuple(rng.random() for _ in range(3)) for _ in range(1000)]
    # Extra probes test intensities and mixed colors not used in recovery.
    probes = [(0.5, 0.5, 0.0)]
    for level in (0.25, 0.5, 0.75):
        for channel in range(3):
            probes.append(tuple(level if i == channel else 0.0 for i in range(3)))
    max_error = max(abs(a-b) for rgb in samples + probes
                    for a, b in zip(teaching_black_box(rgb), predict(rgb)))
    print(f'Recovered gamma: {gamma:.12f}')
    print(f'Wrong affine model midpoint max error: {wrong_error:.12f}')
    print(f'Mixed-color output: {predict((0.5, 0.5, 0.0))}')
    print(f'Independent random colors: {len(samples)}; extra probes: {len(probes)}')
    print(f'Recovered model max absolute error: {max_error:.3e}')
    assert wrong_error > 0.1
    assert abs(gamma - 2.0) < 1e-12
    assert max_error < 1e-12
    print('PASS (synthetic model only; not an Adobe/Nikon validation)')


if __name__ == '__main__':
    main()
