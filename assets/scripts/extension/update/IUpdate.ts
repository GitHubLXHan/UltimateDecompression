export interface IUpdate {
    onUpdate(deltaTime: number): void;
    onLateUpdate?(deltaTime: number): void;
}
