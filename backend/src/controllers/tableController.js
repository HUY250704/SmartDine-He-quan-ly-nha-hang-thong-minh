import Table from '../models/Table.js';

export const getTables = async (req, res) => {
  try {
    const tables = await Table.find().sort('number');
    res.json(tables);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const createTable = async (req, res) => {
  try {
    const { number, status } = req.body;
    if (!number) return res.status(400).json({ error: 'Table number is required' });

    const existing = await Table.findOne({ number });
    if (existing) return res.status(400).json({ error: 'Table number already exists' });

    const table = await Table.create({ number, status: status || 'AVAILABLE' });
    res.status(201).json(table);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const updateTable = async (req, res) => {
  try {
    const { status } = req.body;
    if (status && !['AVAILABLE', 'OCCUPIED', 'RESERVED'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status. Must be AVAILABLE, OCCUPIED, or RESERVED' });
    }

    const table = await Table.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!table) return res.status(404).json({ error: 'Table not found' });
    res.json(table);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const deleteTable = async (req, res) => {
  try {
    const table = await Table.findByIdAndDelete(req.params.id);
    if (!table) return res.status(404).json({ error: 'Table not found' });
    res.json({ message: 'Table deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};