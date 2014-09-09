"use strict";

var should = require("chai").should(),
	expect = require("chai").expect,
	page   = require('webpage').create();

page.open('http://localhost:3100/ti', function (status) {
	console.log('Page status:' + status);
	describe("Database Queries", function () {
		it("should return master value lists from the DB", function () {
			expect(status).to.equal('success');
		});
	});
	phantom.exit();
});