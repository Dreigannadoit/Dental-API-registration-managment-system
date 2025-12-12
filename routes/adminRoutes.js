const express = require('express');
const router = express.Router();
const Patient = require('../models/Patient');
const User = require('../models/User');
const { authMiddleware, adminMiddleware } = require('../middleware/authMiddleware');

// Get all patients (Admin only)
router.get('/patients', authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const patients = await Patient.find()
            .populate('user', 'username email')
            .sort({ createdAt: -1 });

        res.json(patients);
    } catch (error) {
        console.error('Error fetching patients:', error);
        res.status(500).json({ error: 'Failed to fetch patients' });
    }
});

// Get patient by ID (Admin only)
router.get('/patients/:id', authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const patient = await Patient.findById(req.params.id)
            .populate('user', 'username email');

        if (!patient) {
            return res.status(404).json({ error: 'Patient not found' });
        }

        res.json(patient);
    } catch (error) {
        console.error('Error fetching patient:', error);
        res.status(500).json({ error: 'Failed to fetch patient' });
    }
});

// Update patient (Admin only) - ENHANCED
router.patch('/patients/:id', authMiddleware, adminMiddleware, async (req, res) => {
    try {
        console.log('Updating patient:', req.params.id);
        console.log('Update data:', req.body);
        
        const patient = await Patient.findByIdAndUpdate(
            req.params.id,
            req.body,
            { 
                new: true, 
                runValidators: true,
                context: 'query' // This helps with validation
            }
        ).populate('user', 'username email');

        if (!patient) {
            return res.status(404).json({ error: 'Patient not found' });
        }

        res.json({
            message: 'Patient updated successfully',
            patient
        });
    } catch (error) {
        console.error('Error updating patient:', error);
        res.status(500).json({ 
            error: 'Failed to update patient',
            details: error.message 
        });
    }
});

// Delete patient (Admin only)
router.delete('/patients/:id', authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const patient = await Patient.findByIdAndDelete(req.params.id);

        if (!patient) {
            return res.status(404).json({ error: 'Patient not found' });
        }

        // Also delete associated user if needed
        await User.findByIdAndDelete(patient.user);

        res.status(204).send();
    } catch (error) {
        console.error('Error deleting patient:', error);
        res.status(500).json({ error: 'Failed to delete patient' });
    }
});

module.exports = router;