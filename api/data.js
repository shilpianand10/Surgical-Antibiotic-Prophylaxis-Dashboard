export default async (req, res) => {
  try {
    // Fetch aggregated data from the second sheet
    const response = await fetch('https://docs.google.com/spreadsheets/d/1-YsvxaSnl3s-mgZ54lzY80l5ABlR2BP-rNsgsf5Zw10/export?format=csv');
    const csvText = await response.text();
    const rows = csvText.split('\n').map(row => row.split(','));

    const data = [];
    const departments = rows[0].slice(1); // Departments from first row, skip 'Month'

    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      if (row.length < 2) continue;
      const monthName = row[0]?.trim();
      if (!monthName || monthName === ',Departments') continue;

      // Map month name to date string
      const monthMap = {
        'January': '01.01.25',
        'February': '01.02.25',
        'March': '01.03.25',
        'April': '01.04.25',
        'May': '01.05.25',
        'June': '01.06.25',
        'July': '01.07.25',
        'August': '01.08.25',
        'September': '01.09.25',
        'October': '01.10.24',
        'November': '01.11.24',
        'December': '01.12.24'
      };
      const dateStr = monthMap[monthName];
      if (!dateStr) continue;

      for (let j = 1; j < row.length; j++) {
        const count = parseInt(row[j]?.trim()) || 0;
        const department = departments[j - 1]?.trim();
        if (!department) continue;

        for (let k = 0; k < count; k++) {
          data.push({
            date: dateStr,
            department: department,
            surgery: `Surgery ${k + 1}`,
            rightDose: 'Y', // Assume high compliance for demo
            rightAntibiotic: 'Y',
            stoppedWithin24hrs: 'Yes',
            givenWithin60mins: 'Yes',
            noDischargeProphylaxis: 'Y'
          });
        }
      }
    }

    res.status(200).json(data);
  } catch (error) {
    console.error('Error fetching data:', error);
    res.status(500).json({ error: 'Failed to fetch data' });
  }
};
