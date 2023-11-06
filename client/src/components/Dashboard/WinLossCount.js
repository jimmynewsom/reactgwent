import './WinLossCount.scss';

export default function WinLossCount({ count, label }) {
	return (
		<div className="win-loss-count">
			<span>{count}</span>
			<label>{label}</label>
		</div>
	);
}