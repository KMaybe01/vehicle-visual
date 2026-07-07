import type { VehicleState } from '../../types';

interface Props {
  data: VehicleState;
}

const doorLabels: Record<keyof VehicleState['doorStatus'], string> = {
  frontLeft: '左前门',
  frontRight: '右前门',
  rearLeft: '左后门',
  rearRight: '右后门',
};

export default function VehicleStatus({ data }: Props) {
  return (
    <>
      <div className="card">
        <div className="card-title">车门状态</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {(Object.keys(data.doorStatus) as (keyof VehicleState['doorStatus'])[]).map((door) => (
            <div
              key={door}
              style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
            >
              <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                {doorLabels[door]}
              </span>
              <span style={{ display: 'flex', alignItems: 'center' }}>
                <span className={`status-badge ${data.doorStatus[door] ? 'on' : 'off'}`} />
                <span
                  style={{
                    fontSize: 12,
                    color: data.doorStatus[door] ? 'var(--accent-green)' : 'var(--text-muted)',
                  }}
                >
                  {data.doorStatus[door] ? '打开' : '关闭'}
                </span>
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="card">
        <div className="card-title">胎压监测</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {(Object.keys(data.tirePressure) as (keyof VehicleState['tirePressure'])[]).map(
            (tire) => {
              const labels: Record<string, string> = {
                frontLeft: '左前',
                frontRight: '右前',
                rearLeft: '左后',
                rearRight: '右后',
              };
              const pressure = data.tirePressure[tire];
              const isLow = pressure < 2.0;
              return (
                <div
                  key={tire}
                  style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                >
                  <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                    {labels[tire]}
                  </span>
                  <span
                    style={{
                      fontSize: 14,
                      fontWeight: 600,
                      color: isLow ? 'var(--accent-red)' : 'var(--text-primary)',
                    }}
                  >
                    {pressure.toFixed(1)} <span className="stat-unit">bar</span>
                  </span>
                </div>
              );
            },
          )}
        </div>
      </div>

      <div className="card">
        <div className="card-title">车辆状态</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <Row label="档位" value={data.gearPosition} />
          <Row label="油门开度" value={`${data.throttlePos.toFixed(1)} %`} />
          <Row
            label="制动"
            value={data.brakePressed ? '踩下' : '未踩'}
            valueColor={data.brakePressed ? 'var(--accent-red)' : undefined}
          />
          <Row label="转向角" value={`${data.steeringAngle.toFixed(1)}°`} />
          <Row label="里程" value={`${data.odometer.toFixed(1)} km`} />
          <Row label="油量" value={`${data.fuelLevel.toFixed(1)} %`} />
          <Row
            label="冷却液"
            value={`${data.coolantTemp.toFixed(1)} °C`}
            valueColor={data.coolantTemp > 95 ? 'var(--accent-red)' : undefined}
          />
          <Row
            label="电压"
            value={`${data.batteryVoltage.toFixed(2)} V`}
            valueColor={data.batteryVoltage < 11.5 ? 'var(--accent-red)' : undefined}
          />
        </div>
      </div>

      {data.faultCodes.length > 0 && (
        <div className="card" style={{ borderColor: 'var(--accent-red)' }}>
          <div className="card-title" style={{ color: 'var(--accent-red)' }}>
            故障码 ({data.faultCodes.length})
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {data.faultCodes.map((code) => (
              <div
                key={code}
                style={{ fontSize: 13, fontFamily: 'monospace', color: 'var(--accent-red)' }}
              >
                P{code.toString().padStart(4, '0')}
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );
}

function Row({ label, value, valueColor }: { label: string; value: string; valueColor?: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{label}</span>
      <span style={{ fontSize: 13, fontWeight: 600, color: valueColor || 'var(--text-primary)' }}>
        {value}
      </span>
    </div>
  );
}
