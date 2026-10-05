const { isOverlapping } = require('../utils/overlap');

const slot = (start, end) => ({
  start_time: `2026-10-05T${start}:00`,
  end_time: `2026-10-05T${end}:00`,
});

describe('isOverlapping', () => {
  const existing = slot('10:00', '11:00');

  it('detects an identical slot', () => {
    expect(isOverlapping(slot('10:00', '11:00'), existing)).toBe(true);
  });

  it('detects a slot inside the existing one', () => {
    expect(isOverlapping(slot('10:15', '10:45'), existing)).toBe(true);
  });

  it('detects a slot that contains the existing one', () => {
    expect(isOverlapping(slot('09:00', '12:00'), existing)).toBe(true);
  });

  it('detects a partial overlap at the start', () => {
    expect(isOverlapping(slot('09:30', '10:30'), existing)).toBe(true);
  });

  it('detects a partial overlap at the end', () => {
    expect(isOverlapping(slot('10:30', '11:30'), existing)).toBe(true);
  });

  it('allows a slot that starts exactly when the existing one ends', () => {
    expect(isOverlapping(slot('11:00', '12:00'), existing)).toBe(false);
  });

  it('allows a slot that ends exactly when the existing one starts', () => {
    expect(isOverlapping(slot('09:00', '10:00'), existing)).toBe(false);
  });

  it('allows a slot far away', () => {
    expect(isOverlapping(slot('14:00', '15:00'), existing)).toBe(false);
  });
});
