const express = require('express');
const router = express.Router();
const Patient = require('../models/Patient');
const { authMiddleware } = require('../middleware/authMiddleware');

router.post('/', authMiddleware, async (req, res) => {
    try {
        const {
            username,
            email,
            firstName,
            middleInitial,
            lastName,
            dateOfBirth,
            phoneNumber,
            gender,
            address,
            allergies,
            illnesses,
            hasInsurance,
            insuranceProvider,
            insuranceMemberNumber
        } = req.body;

        // Check if patient already exists for this user
        const existingPatient = await Patient.findOne({ user: req.user._id });
        if (existingPatient) {
            return res.status(400).json({ error: 'Patient information already submitted' });
        }

        const patient = new Patient({
            user: req.user._id,
            username,
            email,
            firstName,
            middleInitial,
            lastName,
            dateOfBirth,
            phoneNumber,
            gender,
            address,
            allergies: allergies || [],
            illnesses: illnesses || [],
            hasInsurance: hasInsurance || false,
            insuranceProvider,
            insuranceMemberNumber
        });

        await patient.save();

        res.status(201).json({
            message: 'Patient information saved successfully',
            patient
        });
    } catch (error) {
        console.error('Error saving patient information:', error);
        res.status(500).json({ error: 'Failed to save patient information' });
    }
});

// Get patient information for logged-in user
router.get('/me', authMiddleware, async (req, res) => {
    try {
        const patient = await Patient.findOne({ user: req.user._id });

        if (!patient) {
            return res.status(404).json({ error: 'Patient information not found' });
        }

        res.json(patient);
    } catch (error) {
        console.error('Error fetching patient information:', error);
        res.status(500).json({ error: 'Failed to fetch patient information' });
    }
});

// Update patient information
router.patch('/:id', authMiddleware, async (req, res) => {
    try {
        const updates = req.body;
        const patient = await Patient.findOneAndUpdate(
            { _id: req.params.id, user: req.user._id },
            updates,
            { new: true, runValidators: true }
        );

        if (!patient) {
            return res.status(404).json({ error: 'Patient not found' });
        }

        res.json({
            message: 'Patient information updated successfully',
            patient
        });
    } catch (error) {
        console.error('Error updating patient information:', error);
        res.status(500).json({ error: 'Failed to update patient information' });
    }
});

// Delete patient information
router.delete('/:id', authMiddleware, async (req, res) => {
    try {
        const patient = await Patient.findOneAndDelete({
            _id: req.params.id,
            user: req.user._id
        });

        if (!patient) {
            return res.status(404).json({ error: 'Patient not found' });
        }

        res.status(204).send();
    } catch (error) {
        console.error('Error deleting patient information:', error);
        res.status(500).json({ error: 'Failed to delete patient information' });
    }
});

module.exports = router;