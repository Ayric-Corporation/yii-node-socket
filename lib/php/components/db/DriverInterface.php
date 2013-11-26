<?php
namespace YiiNodeSocket\Component\Db;

use YiiNodeSocket\Model\AModel;

interface DriverInterface {

	/**
	 * @param array $config
	 *
	 * @return void
	 */
	public function init(array $config);

	/**
	 * @param AModel $model
	 *
	 * @return boolean
	 */
	public function save(AModel $model);

	/**
	 * @param AModel $model
	 *
	 * @return boolean
	 */
	public function delete(AModel $model);

	/**
	 * @param AModel $model
	 *
	 * @return boolean
	 */
	public function refresh(AModel $model);

	/**
	 * @param array  $attributes
	 * @param AModel $model
	 *
	 * @return AModel[]
	 */
	public function findByAttributes(array $attributes, AModel $model);
}