export default async (req, res) => {
  console.log('Starting API call v2');
  try {
    const spreadsheetId = '1X0WMigtANT6v9m5wg514emwUumOHvYv7E5vMw4ZxAdk';

    let allRows = [];
    // Fetch data from all sheets using gid (0 to 23 based on sheet order)
    for (let gid = 0; gid <= 0; gid++) {
      try {
        const url = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/export?format=csv&gid=${gid}`;
        const response = await fetch(url);
        console.log(`GID ${gid}: response status ${response.status}`);
        if (response.ok) {
          const csvText = await response.text();
          const rows = csvText.split('\n').map(row => row.split(','));
          console.log(`GID ${gid}: rows length ${rows.length}`);
          if (rows.length > 2) { // Has data
            allRows = allRows.concat(rows.slice(2)); // Skip header rows
          }
        }
      } catch (e) {
        console.log(`Failed to fetch gid ${gid}:`, e.message);
      }
    }
    console.log('Total rows fetched:', allRows.length);

    const data = [];
    // Process all rows from all sheets
    for (let i = 0; i < allRows.length; i++) {
      const row = allRows[i];
      if (row.length < 15) continue; // Skip incomplete rows

      const dateStr = row[2]?.trim(); // Date of surgery
      const department = row[6]?.trim(); // Department
      const antibioticAdministered = row[12]?.trim(); // Antibiotic prophylaxis administered
      const antibioticTimeStr = row[13]?.trim(); // Time of antibiotic administration
      const incisionTimeStr = row[8]?.trim(); // Incision time
      const closeTimeStr = row[9]?.trim(); // Close time (not used)
      const rightDose = row[14]?.trim(); // Antibiotic given at right dose
      const rightAntibiotic = row[15]?.trim(); // Right antibiotic given as per the existing policy
      const stoppedWithin24hrs = row[16]?.trim(); // Antibiotic stopped within 24hrs
      const givenWithin60mins = row[17]?.trim(); // Antibiotic given within 60mins of incision (we'll calculate this)
      const postOpAntibiotics = row[18]?.trim(); // Post op Antibiotics

      if (!dateStr || !department) continue;

      // Parse date and check range (January 2024 to Sep 2025)
      const parts = dateStr.split('.');
      if (parts.length !== 3) continue;
      const day = parseInt(parts[0]);
      const month = parseInt(parts[1]);
      const year = parseInt(parts[2]);
      const fullYear = year < 100 ? (year >= 24 ? 2000 + year : 2000 + year) : year;
      const date = new Date(fullYear, month - 1, day);

      const startDate = new Date(2024, 0, 1); // January 1, 2024
      const endDate = new Date(2025, 8, 30); // Sep 30, 2025
      if (date < startDate || date > endDate) continue;

      // Calculate Right Dose: Y + no antibiotics required (pink cells, inferred as blank or "no antibiotics")
      const noAntibioticsRequired = !antibioticAdministered || antibioticAdministered.toLowerCase().includes('no antibiotic');
      const rightDoseCalc = (rightDose === 'Y' || noAntibioticsRequired) ? 'Y' : 'N';

      // Right Antibiotic: directly from column
      const rightAntibioticCalc = rightAntibiotic === 'Y' ? 'Y' : 'N';

      // Stopped within 24hrs: Yes + no antibiotics administered
      const stoppedCalc = (stoppedWithin24hrs === 'Yes' || noAntibioticsRequired) ? 'Yes' : 'No';

      // Given within 60 mins: calculate time difference
      let within60Calc = 'No';
      if (antibioticTimeStr && incisionTimeStr) {
        const antibioticTime = parseTime(antibioticTimeStr);
        const incisionTime = parseTime(incisionTimeStr);
        if (antibioticTime && incisionTime) {
          const diffMins = (incisionTime - antibioticTime) / (1000 * 60);
          if (diffMins >= 1 && diffMins <= 60) {
            within60Calc = 'Yes';
          }
        }
      }

      // No discharge prophylaxis: blank or "no antibiotic" in post op
      const noDischargeCalc = (!postOpAntibiotics || postOpAntibiotics.toLowerCase().includes('no antibiotic') ||
      postOpAntibiotics.toLowerCase().includes('no antibiotics')) ? 'Y' : 'N';

      // Format date as YYYY-MM-DD for better parsing
      const formattedDate = `${fullYear}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

      data.push({
        date: formattedDate,
        department: department.trim(),
        surgery: row[7]?.trim() || 'Unknown Surgery',
        rightDose: rightDoseCalc,
        rightAntibiotic: rightAntibioticCalc,
        stoppedWithin24hrs: stoppedCalc,
        givenWithin60mins: within60Calc,
        noDischargeProphylaxis: noDischargeCalc
      });
    }

    console.log('Data length:', data.length);
    res.status(200).json(data);
  } catch (error) {
    console.error('Error fetching data:', error);
    res.status(500).json({ error: 'Failed to fetch data' });
  }
};

// Helper function to parse time strings like "8:45 am" or "10:00 am"
function parseTime(timeStr) {
  if (!timeStr) return null;
  const match = timeStr.match(/(\d{1,2}):(\d{2})\s*(am|pm)/i);
  if (!match) return null;
  let hours = parseInt(match[1]);
  const minutes = parseInt(match[2]);
  const ampm = match[3].toLowerCase();
  if (ampm === 'pm' && hours !== 12) hours += 12;
  if (ampm === 'am' && hours === 12) hours = 0;
  return new Date(0, 0, 0, hours, minutes);
}
