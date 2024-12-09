export default function ToggleSwitch() {
    return (
        <>
            <label className="switch">
                <input type="checkbox" checked />
                <span className="slider round"></span>
            </label>
        </>
    );
}