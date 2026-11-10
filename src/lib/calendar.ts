export function getMonthMatrix(year: number, monthIndex: number) {
  // monthIndex: 0 = Jan, 11 = Dec
  const firstDay = new Date(year, monthIndex, 1).getDay(); // 0 is Sunday
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();

  const matrix: (number | null)[][] = [];
  let currentWeek: (number | null)[] = [];

  // Pad beginning with nulls
  for (let i = 0; i < firstDay; i++) {
    currentWeek.push(null);
  }

  for (let day = 1; day <= daysInMonth; day++) {
    currentWeek.push(day);
    if (currentWeek.length === 7) {
      matrix.push(currentWeek);
      currentWeek = [];
    }
  }

  // Pad ending with nulls
  if (currentWeek.length > 0) {
    while (currentWeek.length < 7) {
      currentWeek.push(null);
    }
    matrix.push(currentWeek);
  }

  return matrix;
}

export const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export const DAYS_SHORT = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

