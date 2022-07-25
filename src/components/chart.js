import React from 'react';
import { Area, ComposedChart, Line, CartesianGrid, ReferenceLine, XAxis, YAxis, Tooltip } from 'recharts';

export default function Chart(data) {
    return (
        <ComposedChart id="composed-chart" width={Math.min(1000, window.innerWidth)} height={Math.min(500, Math.floor(window.innerHeight * 0.4))} data={data} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
            <CartesianGrid stroke="#ccc" strokeDasharray=" 5 5" />
            <Area yAxisId="left" type="monotone" dataKey="lte.SNRCurrent" stroke="red" fillOpacity={0.5} fill="red" />
            <Line yAxisId="right" type="monotone" dataKey="lte.RSRPCurrent" stroke="crimson" />
            <Area yAxisId="left" type="monotone" dataKey="nr.SNRCurrent" stroke="blue" fillOpacity={0.5} fill="blue" />
            <Line yAxisId="right" type="monotone" dataKey="nr.RSRPCurrent" stroke="aqua" />
            <XAxis dataKey="time" />
            <YAxis yAxisId="left" label="SNR" unit="dB" domain={[-5, 40]} tickCount={10} />
            <YAxis yAxisId="right" label="RSRP" unit="dBm" domain={[-140, -44]} tickCount={10} orientation='right' />

            <ReferenceLine yAxisId="left" y={data.length ? data.map(plot => plot.lte.SNRCurrent).reduce((max, val) => val > max ? val : max, -5) : ''} label="Max LTE SNR" stroke="red" strokeDasharray="3 3" isFront />
            <ReferenceLine yAxisId="left" y={data.length ? data.map(plot => plot.lte.SNRCurrent).reduce((min, val) => val < min ? val : min, 40) : ''} label="Min LTE SNR" stroke="red" strokeDasharray="3 3" isFront />
            <ReferenceLine yAxisId="right" y={data.length ? data.map(plot => plot.lte.RSRPCurrent).reduce((max, val) => val > max ? val : max, -140) : ''} label="Max LTE RSRP" stroke="crimson" strokeDasharray="3 3" isFront />
            <ReferenceLine yAxisId="right" y={data.length ? data.map(plot => plot.lte.RSRPCurrent).reduce((min, val) => val < min ? val : min, -44) : ''} label="Min LTE RSRP" stroke="crimson" strokeDasharray="3 3" isFront />
            <ReferenceLine yAxisId="left" y={data.length ? data.map(plot => plot.nr.SNRCurrent).reduce((max, val) => val > max ? val : max, -5) : ''} label="Max NR SNR" stroke="blue" strokeDasharray="3 3" isFront />
            <ReferenceLine yAxisId="left" y={data.length ? data.map(plot => plot.nr.SNRCurrent).reduce((min, val) => val < min ? val : min, 40) : ''} label="Min NR SNR" stroke="blue" strokeDasharray="3 3" isFront />
            <ReferenceLine yAxisId="right" y={data.length ? data.map(plot => plot.nr.RSRPCurrent).reduce((max, val) => val > max ? val : max, -140) : ''} label="Max NR RSRP" stroke="aqua" strokeDasharray="3 3" isFront />
            <ReferenceLine yAxisId="right" y={data.length ? data.map(plot => plot.nr.RSRPCurrent).reduce((min, val) => val < min ? val : min, -44) : ''} label="Min NR RSRP" stroke="aqua" strokeDasharray="3 3" isFront />
            <Tooltip />
        </ComposedChart>
    );
}

export function rsrqChart(data) {
    return (
        <ComposedChart id="rsrq-chart" width={Math.min(1000, window.innerWidth)} height={Math.min(500, Math.floor(window.innerHeight * 0.4))} data={data} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
            <CartesianGrid stroke="#ccc" strokeDasharray=" 5 5" />
            <Area type="monotone" dataKey="lte.RSRQCurrent" stroke="red" fillOpacity={0.5} fill="red" />

            <Area type="monotone" dataKey="nr.RSRQCurrent" stroke="blue" fillOpacity={0.5} fill="blue" />

            <XAxis dataKey="time" />
            <YAxis label="RSRQ" unit="dB" domain={[-19.5, -3]} tickCount={9} />

            <ReferenceLine y={data.length ? data.map(plot => plot.lte.RSRQCurrent).reduce((max, val) => val > max ? val : max, -19.5) : ''} label="Max LTE RSRQ" stroke="red" strokeDasharray="3 3" isFront />
            <ReferenceLine y={data.length ? data.map(plot => plot.lte.RSRQCurrent).reduce((min, val) => val < min ? val : min, -3) : ''} label="Min LTE RSRQ" stroke="red" strokeDasharray="3 3" isFront />
            <ReferenceLine y={data.length ? data.map(plot => plot.nr.RSRQCurrent).reduce((max, val) => val > max ? val : max, -19.5) : ''} label="Max NR RSRQ" stroke="blue" strokeDasharray="3 3" isFront />
            <ReferenceLine y={data.length ? data.map(plot => plot.nr.RSRQCurrent).reduce((min, val) => val < min ? val : min, -3) : ''} label="Min NR RSRQ" stroke="blue" strokeDasharray="3 3" isFront />
            <Tooltip />
        </ComposedChart>
    );
}