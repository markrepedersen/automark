import {WebComponent} from "./WebComponent";

export interface Fillable extends WebComponent {
    /**
     * Fills the object with a value. Returns true if the object was filled, false if it already had the desired value.
     * @param value The value to fill with.
     *
     */
    fill(value: string): Promise<boolean>;
}
