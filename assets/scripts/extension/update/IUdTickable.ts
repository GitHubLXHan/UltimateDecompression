export interface IUdTickable {
    onUpdate(deltaTime: number): void;
    onLateUpdate?(deltaTime: number): void;
}
