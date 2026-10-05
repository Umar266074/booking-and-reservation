const isOverlapping = (a, b) =>
  new Date(a.start_time) < new Date(b.end_time) &&
  new Date(a.end_time) > new Date(b.start_time);

module.exports = { isOverlapping };
