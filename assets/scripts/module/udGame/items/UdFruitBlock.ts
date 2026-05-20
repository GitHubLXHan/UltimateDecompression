import { UdBehavior } from "../../../extension/components/UdBehavior";
import { UdSprite } from "../../../extension/game/UdSprite";

const { ccclass, property } = cc._decorator;

/** Data descriptor for a fruit piece */
export interface IUdFruitInfo {
    id: number;
    source: string;
    size: number;
    hasFun: boolean;
    hasContact: boolean;
}

/** Fruit block component - handles physics contact and red-line detection */
@ccclass
export class UdFruitBlock extends UdBehavior {
    @property(UdSprite)
    public fruit_img: UdSprite = undefined;

    id = 0;
    hasFun = false;
    hasContact = false;

    private __payload: IUdFruitInfo;

    // ---- accessors ----

    public get data(): IUdFruitInfo {
        return this.__payload;
    }

    public set data(v: IUdFruitInfo) {
        this.setData(v);
    }

    // ---- data binding ----

    public setData(payload: IUdFruitInfo): void {
        if (!payload) return;
        this.__payload = payload;
        this.id = payload.id;
        this.fruit_img.source = payload.source;
        this.node.width = this.node.height = payload.size;
        this.hasFun = payload.hasFun;
        this.hasContact = payload.hasContact;
    }

    // ---- physics contact callback ----

    onBeginContact(contact: cc.PhysicsContact, self: cc.PhysicsCollider, other: cc.PhysicsCollider) {
        if (!self.node || !other.node) return;

        const selfBlock = self.node.getComponent(UdFruitBlock);
        const otherBlock = other.node.getComponent(UdFruitBlock);

        // Mark contact when hitting another fruit or ground
        if (selfBlock && (otherBlock?.hasContact || other.node.name === 'ground_1')) {
            this.hasContact = true;
        }
        if (!this.hasContact) return;

        // Merge condition: same tier, neither already consumed
        const canMerge =
            selfBlock &&
            otherBlock &&
            selfBlock.id === otherBlock.id &&
            selfBlock.hasFun === false &&
            otherBlock.hasFun === false;

        if (canMerge) {
            selfBlock.hasFun = true;
            otherBlock.hasFun = true;
            self.node.emit('CollideEvent', { self, other });
        }
    }

    // ---- red-line boundary check ----

    private __checkLineCrossing(targetY: number): void {
        if (this.hasContact && this.node.y + this.node.height * 0.5 > targetY) {
            this.node.emit('RedLineEvent');
        }
    }

    /** Schedule a delayed red-line check (3-second grace period) */
    public checkRedLine(targetY: number): void {
        this.scheduleOnce(() => {
            this.__checkLineCrossing(targetY);
        }, 3);
    }

    /** Cancel the pending red-line check */
    public stopCheckRedLine(): void {
        this.unschedule(this.__checkLineCrossing);
    }
}
