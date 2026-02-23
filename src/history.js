/**
 * Undo/Redo history system.
 * Captures JSON snapshots of effectController state.
 * Debounces rapid changes (slider drags) to avoid flooding the stack.
 */
const MAX_HISTORY = 50;
const DEBOUNCE_MS = 300;

export class History {
	constructor() {
		this.undoStack = [];
		this.redoStack = [];
		this.debounceTimer = null;
		this.onRestore = null; // callback(snapshot)
		this._lastSnapshot = null;
	}

	init(getState, onRestore) {
		this._getState = getState;
		this.onRestore = onRestore;

		// Capture initial state
		this._pushImmediate();

		// Keyboard shortcuts
		window.addEventListener("keydown", e => {
			if ((e.ctrlKey || e.metaKey) && e.key === "z" && !e.shiftKey) {
				e.preventDefault();
				this.undo();
			}
			if ((e.ctrlKey || e.metaKey) && e.key === "z" && e.shiftKey) {
				e.preventDefault();
				this.redo();
			}
			if ((e.ctrlKey || e.metaKey) && e.key === "y") {
				e.preventDefault();
				this.redo();
			}
		});
	}

	/**
	 * Record current state (debounced for slider drags).
	 */
	record() {
		clearTimeout(this.debounceTimer);
		this.debounceTimer = setTimeout(() => this._pushImmediate(), DEBOUNCE_MS);
	}

	/**
	 * Record state immediately (for discrete changes like type change).
	 */
	recordImmediate() {
		clearTimeout(this.debounceTimer);
		this._pushImmediate();
	}

	undo() {
		if (this.undoStack.length <= 1) return;
		const current = this.undoStack.pop();
		this.redoStack.push(current);
		const prev = this.undoStack[this.undoStack.length - 1];
		this._restore(prev);
	}

	redo() {
		if (this.redoStack.length === 0) return;
		const next = this.redoStack.pop();
		this.undoStack.push(next);
		this._restore(next);
	}

	_pushImmediate() {
		const snapshot = JSON.stringify(this._getState());
		if (snapshot === this._lastSnapshot) return;
		this._lastSnapshot = snapshot;

		this.undoStack.push(snapshot);
		this.redoStack = [];

		if (this.undoStack.length > MAX_HISTORY) {
			this.undoStack.shift();
		}
	}

	_restore(snapshotStr) {
		this._lastSnapshot = snapshotStr;
		const snapshot = JSON.parse(snapshotStr);
		if (this.onRestore) this.onRestore(snapshot);
	}

	get canUndo() { return this.undoStack.length > 1; }
	get canRedo() { return this.redoStack.length > 0; }
}
