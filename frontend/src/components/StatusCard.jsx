import PropTypes from 'prop-types';

function StatusCard({ label, value, helper }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <p className="text-xs uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-2 text-xl font-semibold text-slate-900">{value}</p>
      <p className="mt-1 text-sm text-slate-600">{helper}</p>
    </div>
  );
}

StatusCard.propTypes = {
  label: PropTypes.string.isRequired,
  value: PropTypes.string.isRequired,
  helper: PropTypes.string,
};

StatusCard.defaultProps = {
  helper: '',
};

export default StatusCard;
