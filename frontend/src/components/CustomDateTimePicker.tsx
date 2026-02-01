import React, { useState } from 'react';
import { View, Text, Modal, TouchableOpacity, StyleSheet, ScrollView, Platform } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAppTheme } from '../context/ThemeContext';
import { format, addMonths, subMonths, startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, isSameMonth, isSameDay, isToday } from 'date-fns';

interface CustomDateTimePickerProps {
    visible: boolean;
    mode: 'date' | 'time';
    onClose: () => void;
    onSelect: (date: Date) => void;
    initialDate?: Date;
}

const CustomDateTimePicker: React.FC<CustomDateTimePickerProps> = ({ visible, mode, onClose, onSelect, initialDate }) => {
    const { isDark, theme } = useAppTheme();
    const colors = theme.colors;
    const [selectedDate, setSelectedDate] = useState(initialDate || new Date());
    const [viewDate, setViewDate] = useState(initialDate || new Date()); // For navigating months

    // Time state
    const [selectedHour, setSelectedHour] = useState(selectedDate.getHours());
    const [selectedMinute, setSelectedMinute] = useState(selectedDate.getMinutes());

    const handleDateSelect = (date: Date) => {
        const newDate = new Date(selectedDate);
        newDate.setFullYear(date.getFullYear(), date.getMonth(), date.getDate());
        setSelectedDate(newDate);
        onSelect(newDate);
        // Don't close immediately to let user see selection, or maybe close? 
        // Standard UX: click date -> closes.
        onClose();
    };

    const handleTimeConfirm = () => {
        const newDate = new Date(selectedDate);
        newDate.setHours(selectedHour);
        newDate.setMinutes(selectedMinute);
        onSelect(newDate);
        onClose();
    };

    const renderCalendar = () => {
        const monthStart = startOfMonth(viewDate);
        const monthEnd = endOfMonth(monthStart);
        const startDate = startOfWeek(monthStart);
        const endDate = endOfWeek(monthEnd);

        const dateFormat = "d";
        const rows = [];
        let days = [];
        let day = startDate;
        let formattedDate = "";

        const daysInMonth = eachDayOfInterval({ start: startDate, end: endDate });

        return (
            <View>
                {/* Header */}
                <View style={styles.calendarHeader}>
                    <TouchableOpacity onPress={() => setViewDate(subMonths(viewDate, 1))}>
                        <MaterialCommunityIcons name="chevron-left" size={24} color={colors.text} />
                    </TouchableOpacity>
                    <Text style={[styles.monthTitle, { color: colors.text }]}>
                        {format(viewDate, "MMMM yyyy")}
                    </Text>
                    <TouchableOpacity onPress={() => setViewDate(addMonths(viewDate, 1))}>
                        <MaterialCommunityIcons name="chevron-right" size={24} color={colors.text} />
                    </TouchableOpacity>
                </View>

                {/* Days Config */}
                <View style={styles.weekDays}>
                    {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d, i) => (
                        <Text key={i} style={[styles.weekDayText, { color: colors.subText }]}>{d}</Text>
                    ))}
                </View>

                {/* Grid */}
                <View style={styles.daysGrid}>
                    {daysInMonth.map((dayItem, index) => {
                        const isSelected = isSameDay(dayItem, selectedDate);
                        const isCurrentMonth = isSameMonth(dayItem, monthStart);

                        return (
                            <TouchableOpacity
                                key={index}
                                style={[
                                    styles.dayCell,
                                    isSelected && { backgroundColor: colors.primary },
                                    !isCurrentMonth && { opacity: 0.3 }
                                ]}
                                onPress={() => handleDateSelect(dayItem)}
                            >
                                <Text style={[
                                    styles.dayText,
                                    { color: isSelected ? '#fff' : colors.text },
                                    isToday(dayItem) && !isSelected && { color: colors.primary, fontWeight: 'bold' }
                                ]}>
                                    {format(dayItem, dateFormat)}
                                </Text>
                            </TouchableOpacity>
                        );
                    })}
                </View>
            </View>
        );
    };

    const renderTimePicker = () => {
        const hours = Array.from({ length: 24 }, (_, i) => i);
        const minutes = Array.from({ length: 12 }, (_, i) => i * 5); // 5 min intervals

        return (
            <View style={styles.timeContainer}>
                <Text style={[styles.timeTitle, { color: colors.text }]}>Select Time</Text>

                <View style={styles.timeSelectors}>
                    {/* Hours */}
                    <ScrollView style={styles.timeColumn} showsVerticalScrollIndicator={false}>
                        {hours.map(h => (
                            <TouchableOpacity
                                key={h}
                                style={[styles.timeCell, selectedHour === h && { backgroundColor: colors.primary }]}
                                onPress={() => setSelectedHour(h)}
                            >
                                <Text style={[styles.timeText, { color: selectedHour === h ? '#fff' : colors.text }]}>
                                    {h.toString().padStart(2, '0')}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>

                    <Text style={[styles.timeSeparator, { color: colors.text }]}>:</Text>

                    {/* Minutes */}
                    <ScrollView style={styles.timeColumn} showsVerticalScrollIndicator={false}>
                        {minutes.map(m => (
                            <TouchableOpacity
                                key={m}
                                style={[styles.timeCell, selectedMinute === m && { backgroundColor: colors.primary }]}
                                onPress={() => setSelectedMinute(m)}
                            >
                                <Text style={[styles.timeText, { color: selectedMinute === m ? '#fff' : colors.text }]}>
                                    {m.toString().padStart(2, '0')}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                </View>

                <TouchableOpacity
                    style={[styles.confirmButton, { backgroundColor: colors.primary }]}
                    onPress={handleTimeConfirm}
                >
                    <Text style={styles.confirmButtonText}>Confirm Time</Text>
                </TouchableOpacity>
            </View>
        );
    };

    return (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
            onRequestClose={onClose}
        >
            <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={onClose}>
                <View style={[styles.modalContent, { backgroundColor: isDark ? '#1E1E1E' : '#FFFFFF' }]}>
                    <View onStartShouldSetResponder={() => true}>
                        {mode === 'date' ? renderCalendar() : renderTimePicker()}

                        <TouchableOpacity style={styles.closeButton} onPress={onClose}>
                            <Text style={styles.closeButtonText}>Cancel</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </TouchableOpacity>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.6)',
        justifyContent: 'center',
        alignItems: 'center', // Center the modal
        padding: 20,
    },
    modalContent: {
        width: '100%',
        maxWidth: 340, // Constrain width for a compact, premium feel
        borderRadius: 24,
        padding: 24,
        elevation: 10,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
    },
    calendarHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
        paddingHorizontal: 8,
    },
    monthTitle: {
        fontSize: 18,
        fontWeight: '700',
        letterSpacing: 0.5,
    },
    weekDays: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 12,
    },
    weekDayText: {
        width: '14.28%',
        textAlign: 'center',
        fontSize: 13,
        fontWeight: '600',
        color: '#A0AEC0',
    },
    daysGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
    },
    dayCell: {
        width: '14.28%',
        aspectRatio: 1,
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 100, // Fully circular
        marginVertical: 2,
    },
    dayText: {
        fontSize: 15,
        fontWeight: '500',
    },
    closeButton: {
        marginTop: 20,
        alignSelf: 'center',
        paddingVertical: 10,
        paddingHorizontal: 20,
    },
    closeButtonText: {
        color: '#EF4444',
        fontSize: 16,
        fontWeight: '600',
    },
    // Time Styles
    timeContainer: {
        alignItems: 'center',
        paddingTop: 8,
    },
    timeTitle: {
        fontSize: 20,
        fontWeight: '600',
        marginBottom: 24,
    },
    timeSelectors: {
        flexDirection: 'row',
        height: 180,
        width: '100%',
        justifyContent: 'center',
        gap: 20,
    },
    timeColumn: {
        flex: 1,
        backgroundColor: 'rgba(128,128,128,0.05)',
        borderRadius: 12,
        overflow: 'hidden',
    },
    timeCell: {
        height: 44,
        justifyContent: 'center',
        alignItems: 'center',
        marginVertical: 2,
        marginHorizontal: 4,
        borderRadius: 8,
    },
    timeText: {
        fontSize: 18,
        fontWeight: '500',
    },
    timeSeparator: {
        fontSize: 32,
        alignSelf: 'center',
        fontWeight: 'bold',
        opacity: 0.5,
    },
    confirmButton: {
        marginTop: 24,
        paddingHorizontal: 40,
        paddingVertical: 14,
        borderRadius: 30,
        width: '100%',
        alignItems: 'center',
        elevation: 2,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
    },
    confirmButtonText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 16,
        letterSpacing: 0.5,
    }
});

export default CustomDateTimePicker;
