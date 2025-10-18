# Amrita Dashboard - Surgical Antibiotic Prophylaxis

A comprehensive React dashboard for monitoring and tracking surgical antibiotic prophylaxis compliance at Amrita Hospital.

## Features

- **Real-time Data Visualization**: Interactive charts and graphs showing compliance metrics
- **Department-wise Analysis**: Track performance across different surgical departments
- **Monthly Trends**: Monitor compliance trends over time
- **Filtering Capabilities**: Filter data by month and department
- **Compliance Metrics**: Track four key compliance indicators:
  - Right Dose
  - Right Antibiotic
  - Stopped within 24 hours
  - Given within 60 minutes
- **Responsive Design**: Works seamlessly on desktop and mobile devices

## Technology Stack

- **React 18**: Modern React with hooks
- **Recharts**: Interactive charts and data visualization
- **Tailwind CSS**: Utility-first CSS framework
- **Lucide React**: Beautiful, customizable icons

## Getting Started

### Prerequisites

- Node.js (version 14 or higher)
- npm or yarn package manager

### Installation

1. Clone or download this project
2. Navigate to the project directory:
   ```bash
   cd "Amrita Dashboard"
   ```

3. Install dependencies:
   ```bash
   npm install
   ```

4. Start the development server:
   ```bash
   npm start
   ```

5. Open your browser and navigate to `http://localhost:3000`

### Building for Production

To create a production build:

```bash
npm run build
```

This will create an optimized build in the `build` folder.

## Project Structure

```
Amrita Dashboard/
├── public/
│   └── index.html
├── src/
│   ├── components/
│   │   └── Dashboard.js
│   ├── App.js
│   ├── index.js
│   └── index.css
├── package.json
├── tailwind.config.js
├── postcss.config.js
└── README.md
```

## Dashboard Components

### Main Metrics Cards
- Total Surgeries
- Overall Compliance
- Right Dose Compliance
- Right Antibiotic Compliance
- Stopped within 24hrs
- Given within 60mins

### Visualizations
- **Line Chart**: Department-wise surgery volume trends over time
- **Pie Charts**: Compliance metrics by department for each criterion
- **Data Table**: Recent surgeries with compliance status

### Filters
- Month selection (All months from May 2024 onwards)
- Department selection (All surgical departments)

## Data Structure

The dashboard uses sample data with the following structure:

```javascript
{
  date: "09.05.24",
  department: "Cardiac",
  surgery: "Surgery Type 1",
  rightDose: "Y",
  rightAntibiotic: "Y",
  stoppedWithin24hrs: "Yes",
  givenWithin60mins: "Yes"
}
```

## Customization

### Adding New Departments
Edit the `departments` array in the `generateSampleData` function in `Dashboard.js`.

### Modifying Date Range
Update the `months` array in the `generateSampleData` function.

### Styling Changes
Modify the Tailwind CSS classes or update the `tailwind.config.js` file for custom styling.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is developed for Amrita Hospital's internal use.

## Support

For technical support or questions, please contact the development team.
