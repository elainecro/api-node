CREATE DATABASE findPeople;

USE findPeople;

CREATE TABLE users ( 
	Id BINARY(16) PRIMARY KEY, 
	Name VARCHAR(100) NOT NULL, 
	NickName VARCHAR(100) NOT NULL, 
	Relevance INT NULL 
);