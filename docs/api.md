# pbPlayer api documentation

### 




## Tools

### PB.Request.builQueryString
### PB.Request.parseQueryString


## PB.Request

PB.Request our OOP style of doing a request.

The constructor will only initialize our `Request` object, the sending of the request will happen when the `send` method is called.

###### Signature
~~~js
var request = new PB.Request({
	
	url: '/file.json',
	method: 'GET',
	ayns: true,
	// Force datatypes, only one could be true..
	json: true,
	xml: true,
	data: {
		
		foo: 'bar'
	},
	auth: {
		
		user: 'foo',
		pass: 'bar'
	},
	headers: {},
	encoding: 'UTF-8',
	timeout: 0
});
~~~

###### Arguments
{Object} - Request options

###### Returns
{Object} - PB.Request

---

### send

Send out request.

> When sending the same request object multiple times, the previous requests will be aborted.

###### Signature
~~~js
request.send();
~~~

###### Returns
{Object} - PB.Request

---

