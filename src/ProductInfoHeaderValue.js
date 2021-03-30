class ProductInfoHeaderValue {
	constructor(product, version) {
		this.Product = product;
		this.Version = version;
	}
	Value() {
		return this.Product + " " + this.Version;
	}
	toString() {
		return this.Value()
	}
}
module.exports = {
	ProductInfoHeaderValue,
};
