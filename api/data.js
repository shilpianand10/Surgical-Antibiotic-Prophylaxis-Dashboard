export default async (req, res) => {
  try {
    const response = await fetch('https://docs.google.com/spreadsheets/d/1X0WMigtANT6v9m5wg514emwUumOHvYv7E5vMw4ZxAdk/export?format=csv');
    const csvText = await response.text();
    const rows = csvText.split('\n').map(row => row.split(','));

    const data = [];
    // Skip header rows (first 2)
    for (let i = 2; i < rows.length; i++) {
      const row = rows[i];
      if (row.length < 18) continue; // Skip incomplete rows

      const dateStr = row[2]?.trim(); // Date of surgery
      const department = row[6]?.trim(); // Department
      const rightDose = row[14]?.trim(); // Antibiotic given at right dose
      const rightAntibiotic = row[15]?.trim(); // Right antibiotic given as per the existing policy
      const stoppedWithin24hrs = row[16]?.trim(); // Antibiotic stopped within 24hrs
      const givenWithin60mins = row[17]?.trim(); // Antibiotic given within 60mins of incision
      const postOpAntibiotics = row[18]?.trim(); // Post op Antibiotics

      if (!dateStr || !department) continue;

      // Parse date and check range
      const parts = dateStr.split('.');
      if (parts.length !== 3) continue;
      const day = parseInt(parts[0]);
      const month = parseInt(parts[1]);
      const year = parseInt(parts[2]);
      const fullYear = year < 100 ? (year >= 24 ? 2000 + year : 2000 + year) : year;
      const date = new Date(fullYear, month - 1, day);

      const startDate = new Date(2023, 9, 1); // October 1, 2023
      const endDate = new Date(2025, 8, 30); // Sep 30, 2025
      if (date < startDate || date > endDate) continue;

      // Determine no discharge prophylaxis
      const noDischargeProphylaxis = !postOpAntibiotics || postOpAntibiotics.toLowerCase().includes('no') ||
                                    postOpAntibiotics.toLowerCase().includes('discharge') ? 'Y' : 'N';

      data.push({
        date: dateStr,
        department: department,
        surgery: row[7]?.trim() || 'Unknown Surgery',
        rightDose: rightDose === 'Y' ? 'Y' : 'N',
        rightAntibiotic: rightAntibiotic === 'Y' ? 'Y' : 'N',
        stoppedWithin24hrs: stoppedWithin24hrs === 'Yes' ? 'Yes' : 'No',
        givenWithin60mins: givenWithin60mins === 'Yes' ? 'Yes' : 'No',
        noDischargeProphylaxis: noDischargeProphylaxis
      });
    }

    res.status(200).json(data);
  } catch (error) {
    console.error('Error fetching data:', error);
    res.status(500).json({ error: 'Failed to fetch data' });
  }
};
