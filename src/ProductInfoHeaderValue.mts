export class ProductInfoHeaderValue {
	Product: string;
	Version: string | number;
	constructor(Product: string, Version: string | number) {
		this.Product = Product;
		this.Version = Version;
	}
	Value(): string {
		return this.Product + " " + this.Version;
	}
	toString(): string {
		return this.Value();
	}
}
