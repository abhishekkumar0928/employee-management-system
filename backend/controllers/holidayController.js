const Holiday = require('../models/Holiday');

// Normalize date to UTC midnight (timezone-robust)
const getMidnightDate = (dateStr) => {
  if (!dateStr) return new Date();
  
  if (dateStr instanceof Date) {
    const y = dateStr.getFullYear();
    const m = dateStr.getMonth();
    const d = dateStr.getDate();
    return new Date(Date.UTC(y, m, d, 0, 0, 0, 0));
  }
  
  if (typeof dateStr === 'string') {
    const match = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (match) {
      const y = parseInt(match[1], 10);
      const m = parseInt(match[2], 10) - 1;
      const d = parseInt(match[3], 10);
      return new Date(Date.UTC(y, m, d, 0, 0, 0, 0));
    }
  }

  const parsed = new Date(dateStr);
  return new Date(Date.UTC(parsed.getUTCFullYear(), parsed.getUTCMonth(), parsed.getUTCDate(), 0, 0, 0, 0));
};

// Seed Indian national holidays if none exist
const seedDefaultHolidays = async () => {
  try {
    const count = await Holiday.countDocuments();
    if (count === 0) {
      const year = new Date().getFullYear(); // e.g. 2026
      const defaults = [
        { name: 'Republic Day', date: new Date(Date.UTC(year, 0, 26)), isCustom: false },
        { name: 'Holi', date: new Date(Date.UTC(year, 2, 3)), isCustom: false }, // March 3, 2026 approx
        { name: 'Eid al-Fitr', date: new Date(Date.UTC(year, 2, 20)), isCustom: false }, // March 20, 2026 approx
        { name: 'Independence Day', date: new Date(Date.UTC(year, 7, 15)), isCustom: false }, // Aug 15
        { name: 'Raksha Bandhan', date: new Date(Date.UTC(year, 7, 28)), isCustom: false }, // Aug 28, 2026 approx
        { name: 'Janmashtami', date: new Date(Date.UTC(year, 8, 4)), isCustom: false }, // Sept 4, 2026 approx
        { name: 'Dussehra', date: new Date(Date.UTC(year, 9, 20)), isCustom: false }, // Oct 20, 2026 approx
        { name: 'Diwali', date: new Date(Date.UTC(year, 10, 8)), isCustom: false }, // Nov 8, 2026 approx
        { name: 'Guru Nanak Jayanti', date: new Date(Date.UTC(year, 10, 24)), isCustom: false }, // Nov 24, 2026 approx
        { name: 'Christmas Day', date: new Date(Date.UTC(year, 11, 25)), isCustom: false } // Dec 25
      ];
      await Holiday.insertMany(defaults);
      console.log('Seeded default Indian national holidays');
    }
  } catch (error) {
    console.error('Error seeding holidays:', error.message);
  }
};

// @desc    Get all holidays
// @route   GET /api/holidays
// @access  Private
const getHolidays = async (req, res) => {
  try {
    // Run seed if database has empty holidays
    await seedDefaultHolidays();
    const holidays = await Holiday.find().sort({ date: 1 });
    return res.status(200).json(holidays);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// @desc    Add custom holiday
// @route   POST /api/holidays
// @access  Private (Super Admin, HR Manager)
const addHoliday = async (req, res) => {
  try {
    const { name, date } = req.body;
    if (!name || !date) {
      return res.status(400).json({ message: 'Please provide both name and date' });
    }

    const targetDate = getMidnightDate(date);

    // Check duplicate date
    const exists = await Holiday.findOne({ date: targetDate });
    if (exists) {
      return res.status(400).json({ message: 'A holiday is already scheduled for this date' });
    }

    const holiday = await Holiday.create({
      name,
      date: targetDate,
      isCustom: true
    });

    return res.status(201).json(holiday);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// @desc    Delete custom holiday
// @route   DELETE /api/holidays/:id
// @access  Private (Super Admin, HR Manager)
const deleteHoliday = async (req, res) => {
  try {
    const holiday = await Holiday.findById(req.params.id);
    if (!holiday) {
      return res.status(404).json({ message: 'Holiday not found' });
    }

    await Holiday.findByIdAndDelete(req.params.id);
    return res.status(200).json({ message: 'Holiday deleted successfully' });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getHolidays,
  addHoliday,
  deleteHoliday,
  seedDefaultHolidays
};
