import React, { useState } from 'react';
import { Modal } from 'antd';

const formatTimeDisplay = (value) => {
    if (!value) return '--:-- --';
    const [h, m] = value.split(':').map(Number);
    const hour12 = h % 12 || 12;
    const ampm = h >= 12 ? 'PM' : 'AM';
    return `${hour12}:${String(m).padStart(2, '0')} ${ampm}`;
};

const S = 240;
const c = S / 2;
const r = S / 2 - 8;

const handX = (angle, length) => c + r * length * Math.cos(angle * Math.PI / 180);
const handY = (angle, length) => c + r * length * Math.sin(angle * Math.PI / 180);

function getAngleFromClick(e) {
    const svg = e.currentTarget;
    const rect = svg.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const x = e.clientX - cx;
    const y = e.clientY - cy;
    let angle = Math.atan2(y, x) * (180 / Math.PI) + 90;
    if (angle < 0) angle += 360;
    return angle;
}

const tickMarks = [];
for (let i = 0; i < 60; i++) {
    const a = (i * 6 - 90) * Math.PI / 180;
    const isHour = i % 5 === 0;
    const inner = isHour ? 0.82 : 0.9;
    const outer = 0.95;
    tickMarks.push(
        <line key={i}
            x1={c + r * inner * Math.cos(a)} y1={c + r * inner * Math.sin(a)}
            x2={c + r * outer * Math.cos(a)} y2={c + r * outer * Math.sin(a)}
            stroke={isHour ? 'var(--gray-700)' : 'var(--gray-400)'}
            strokeWidth={isHour ? 2.5 : 1} strokeLinecap="round"
        />
    );
}

const hourNumbers = [12, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map((h, i) => {
    const a = (i * 30 - 90) * Math.PI / 180;
    return (
        <text key={h} x={c + r * 0.74 * Math.cos(a)} y={c + r * 0.74 * Math.sin(a)}
            textAnchor="middle" dominantBaseline="central"
            fontSize="14" fontWeight="700" fill="var(--gray-700)"
            style={{ pointerEvents: 'none' }}
        >{h}</text>
    );
});

export default function ClockPicker({ value, onChange, style }) {
    const [modalOpen, setModalOpen] = useState(false);
    const [pickerHour, setPickerHour] = useState(12);
    const [pickerMinute, setPickerMinute] = useState(0);
    const [pickerAmPm, setPickerAmPm] = useState('AM');

    const openPicker = () => {
        if (value) {
            const [h, m] = value.split(':').map(Number);
            setPickerHour(h % 12 || 12);
            setPickerMinute(m);
            setPickerAmPm(h >= 12 ? 'PM' : 'AM');
        } else {
            const now = new Date();
            setPickerHour(now.getHours() % 12 || 12);
            setPickerMinute(now.getMinutes());
            setPickerAmPm(now.getHours() >= 12 ? 'PM' : 'AM');
        }
        setModalOpen(true);
    };

    const handleConfirm = () => {
        let hour24 = pickerHour;
        if (pickerAmPm === 'PM' && pickerHour !== 12) hour24 += 12;
        if (pickerAmPm === 'AM' && pickerHour === 12) hour24 = 0;
        onChange(`${String(hour24).padStart(2, '0')}:${String(pickerMinute).padStart(2, '0')}`);
        setModalOpen(false);
    };

    const handleClockHourClick = (e) => {
        const angle = getAngleFromClick(e);
        const h = Math.round(angle / 30) % 12;
        setPickerHour(h === 0 ? 12 : h);
    };

    const handleClockMinuteClick = (e) => {
        const angle = getAngleFromClick(e);
        setPickerMinute(Math.round(angle / 6) % 60);
    };

    const hourAngle = ((pickerHour % 12) / 12) * 360 + (pickerMinute / 60) * 30 - 90;
    const minuteAngle = (pickerMinute / 60) * 360 - 90;

    return (
        <>
            <div
                onClick={openPicker}
                style={{
                    border: 'none',
                    background: 'transparent',
                    fontFamily: 'inherit',
                    fontSize: '0.95rem',
                    fontWeight: 700,
                    color: 'var(--red)',
                    cursor: 'pointer',
                    userSelect: 'none',
                    WebkitUserSelect: 'none',
                    WebkitTouchCallout: 'none',
                    ...style
                }}
            >
                {formatTimeDisplay(value)}
            </div>
            <Modal
                title="Select Time"
                open={modalOpen}
                onCancel={() => setModalOpen(false)}
                footer={null}
                styles={{ body: { padding: '1rem', background: 'var(--white)' } }}
                classNames={{ wrapper: 'add-category-modal', header: 'add-category-header', body: 'add-category-body' }}
                mask={{ closable: true }}
                destroyOnHidden={true}
            >
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem', background: 'var(--white)' }}>
                    <div style={{ fontSize: '1.5rem', fontWeight: 900, color: 'var(--gray-900)' }}>
                        {pickerHour}:{String(pickerMinute).padStart(2, '0')} {pickerAmPm}
                    </div>

                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button type="button" onClick={() => {
                            const now = new Date();
                            setPickerHour(now.getHours() % 12 || 12);
                            setPickerMinute(now.getMinutes());
                            setPickerAmPm(now.getHours() >= 12 ? 'PM' : 'AM');
                        }}
                            style={{ padding: '0.3rem 1rem', borderRadius: '20px', border: '1.5px solid var(--gray-300)', background: 'transparent', color: 'var(--gray-600)', fontWeight: 600, fontSize: '0.75rem', cursor: 'pointer' }}>Now</button>
                    </div>

                    {/* Clock face */}
                    <svg
                        style={{ width: '100%', maxWidth: '300px', height: 'auto', display: 'block', cursor: 'pointer' }}
                        viewBox={`0 0 ${S} ${S}`}
                        preserveAspectRatio="xMidYMid meet"
                        onClick={handleClockHourClick}
                    >
                        <circle cx={c} cy={c} r={r} fill="var(--gray-100)" stroke="var(--gray-200)" strokeWidth="1.5" />
                        {tickMarks}
                        {hourNumbers}

                        {/* Hour hand */}
                        <line x1={c} y1={c} x2={handX(hourAngle, 0.48)} y2={handY(hourAngle, 0.48)}
                            stroke="var(--red)" strokeWidth="4" strokeLinecap="round" />
                        {/* Minute hand */}
                        <line x1={c} y1={c} x2={handX(minuteAngle, 0.65)} y2={handY(minuteAngle, 0.65)}
                            stroke="var(--gray-800)" strokeWidth="2.5" strokeLinecap="round" />
                        {/* Center dot */}
                        <circle cx={c} cy={c} r="5" fill="var(--red)" />
                    </svg>

                    <div style={{ fontSize: '0.8rem', color: 'var(--gray-500)', fontWeight: 600 }}>Click the clock to set the hour</div>

                    {/* Minute fine-tune */}
                    <div style={{ width: '100%' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', justifyContent: 'center' }}>
                            <button type="button" onClick={() => setPickerMinute(p => (p - 1 + 60) % 60)}
                                style={{ width: '36px', height: '36px', borderRadius: '50%', border: '1.5px solid var(--gray-300)', background: 'var(--white)', color: 'var(--gray-700)', fontWeight: 700, fontSize: '1.1rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>−</button>
                            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--gray-800)', minWidth: '60px', textAlign: 'center' }}>{String(pickerMinute).padStart(2, '0')}</div>
                            <button type="button" onClick={() => setPickerMinute(p => (p + 1) % 60)}
                                style={{ width: '36px', height: '36px', borderRadius: '50%', border: '1.5px solid var(--gray-300)', background: 'var(--white)', color: 'var(--gray-700)', fontWeight: 700, fontSize: '1.1rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>+</button>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: '0.3rem', marginTop: '0.75rem' }}>
                            {[0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55].map(m => (
                                <button key={m} type="button" onClick={() => setPickerMinute(m)}
                                    style={{ padding: '0.35rem 0', borderRadius: '6px', border: pickerMinute === m ? '1.5px solid var(--red)' : '1px solid var(--gray-300)', background: pickerMinute === m ? 'var(--red)' : 'var(--white)', color: pickerMinute === m ? '#ffffff' : 'var(--gray-700)', fontWeight: 700, fontSize: '0.7rem', cursor: 'pointer', textAlign: 'center' }}>{String(m).padStart(2, '0')}</button>
                            ))}
                        </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', width: '100%' }}>
                        <button type="button" onClick={() => setPickerAmPm('AM')}
                            style={{ padding: '0.5rem', borderRadius: '8px', border: pickerAmPm === 'AM' ? '2px solid var(--red)' : '1px solid var(--gray-300)', background: pickerAmPm === 'AM' ? 'var(--red)' : 'var(--white)', color: pickerAmPm === 'AM' ? '#ffffff' : 'var(--gray-700)', fontWeight: 700, fontSize: '0.9rem', cursor: 'pointer', transition: 'all 0.2s' }}>AM</button>
                        <button type="button" onClick={() => setPickerAmPm('PM')}
                            style={{ padding: '0.5rem', borderRadius: '8px', border: pickerAmPm === 'PM' ? '2px solid var(--red)' : '1px solid var(--gray-300)', background: pickerAmPm === 'PM' ? 'var(--red)' : 'var(--white)', color: pickerAmPm === 'PM' ? '#ffffff' : 'var(--gray-700)', fontWeight: 700, fontSize: '0.9rem', cursor: 'pointer', transition: 'all 0.2s' }}>PM</button>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', borderTop: '1px solid var(--gray-200)', paddingTop: '1rem', width: '100%' }}>
                        <button type="button" className="btn btn-outline" onClick={() => setModalOpen(false)}>Cancel</button>
                        <button type="button" className="btn btn-primary" style={{ background: 'var(--red)', borderColor: 'var(--red)' }} onClick={handleConfirm}>Confirm</button>
                    </div>
                </div>
            </Modal>
        </>
    );
}
